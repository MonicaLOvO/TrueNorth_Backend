import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../../Modules/category/service/category.service.js';
import type { GuidedResponseDto, ChatResponseDto } from '../dto/decisions-response.dto';
import { AiOrchestratorService } from '../logic/ai-orchestrator.service';
import type { GuidedLifecycleResponseDto } from '../dto/guided-lifecycle-response.dto';
import { ChatService } from '../../../Modules/chat/service/chat.service.js';
import { ExploreService } from '../../../Modules/explore/service/explore.service.js';
import { ConversationService } from '../../../Modules/chat/service/conversation.service.js';
import { QuestionService } from '../../../Modules/question/service/question.service.js';
import { AnswerService } from '../../../Modules/question/service/answer.service.js';
import type { GuidedNextRequestDto } from '../dto/guided-next-request.dto';
import type { GuidedSkipRequestDto } from '../dto/guided-skip-request.dto';

@Injectable()
export class DecisionsService {
  constructor(
    private readonly aiOrchestrator: AiOrchestratorService,
    private readonly categoryService: CategoryService,
    private readonly chatService: ChatService,
    private readonly exploreService: ExploreService,
    private readonly conversationService: ConversationService,
    private readonly questionService: QuestionService,
    private readonly answerService: AnswerService,
  ) {}

  async guidedFlow(categoryId: string, answers: Record<string, string>): Promise<GuidedResponseDto> {
    const category = await this.categoryService.findById(categoryId).catch(() => null);
    if (!category) {
      throw new NotFoundException(`Category with id '${categoryId}' not found`);
    }
    const { explores } = await this.aiOrchestrator.runFinalizeExplores({
      categoryName: category.name,
      answers,
    });

    return { explores };
  }

  async chatFlow(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<ChatResponseDto> {
    const { reply, explores } = await this.aiOrchestrator.runChat({
      messages,
    });

    return { message: reply, explores };
  }

  async startGuided(chatId: string): Promise<GuidedLifecycleResponseDto> {
    const categoryName = await this.resolveCategoryNameByChat(chatId);
    const conversationHistory = await this.buildConversationHistory(chatId);
    const { reply, question: aiQuestion } = await this.aiOrchestrator.runGuidedQuestion({
      categoryName,
      answers: {},
      conversationHistory,
    });
    if (!aiQuestion) {
      return {
        chatId,
        stage: 'start',
        message: reply,
        explores: [],
      };
    }
    const question = await this.persistGuidedTurn({
      chatId,
      action: 'start',
      promptSummary: `Category: ${categoryName}`,
      reply,
      questionPrompt: aiQuestion.prompt,
      questionOptions: aiQuestion.options,
    });
    return {
      chatId,
      stage: 'start',
      message: reply,
      question,
      explores: [],
    };
  }

  async nextGuided(chatId: string, payload: GuidedNextRequestDto): Promise<GuidedLifecycleResponseDto> {
    if (payload.optionId?.trim()) {
      await this.answerService.create(payload.optionId.trim(), payload.userId ?? null);
    }
    const categoryName = await this.resolveCategoryNameByChat(chatId);
    const conversationHistory = await this.buildConversationHistory(chatId);
    const answerKey = payload.answerKey?.trim() || 'selectedOption';
    const answerValue = payload.answerValue?.trim() || payload.optionId?.trim() || 'unspecified';
    const { reply, question: aiQuestion } = await this.aiOrchestrator.runGuidedQuestion({
      categoryName,
      answers: {
        [answerKey]: answerValue,
      },
      conversationHistory,
    });
    if (!aiQuestion) {
      return {
        chatId,
        stage: 'next',
        message: reply,
        explores: [],
      };
    }
    const question = await this.persistGuidedTurn({
      chatId,
      action: 'next',
      promptSummary: `${answerKey}: ${answerValue}`,
      reply,
      questionPrompt: aiQuestion.prompt,
      questionOptions: aiQuestion.options,
    });
    return {
      chatId,
      stage: 'next',
      message: reply,
      question,
      explores: [],
    };
  }

  async skipGuided(chatId: string, payload: GuidedSkipRequestDto): Promise<GuidedLifecycleResponseDto> {
    const questionContext = payload.questionContext;
    const reason = payload.reason;
    const categoryName = await this.resolveCategoryNameByChat(chatId);
    const conversationHistory = await this.buildConversationHistory(chatId);
    const { reply, question: aiQuestion } = await this.aiOrchestrator.runGuidedQuestion({
      categoryName,
      answers: {
        skippedQuestion: questionContext ?? 'unspecified',
        skipReason: reason ?? 'user skipped',
      },
      conversationHistory,
    });
    if (!aiQuestion) {
      return {
        chatId,
        stage: 'skip',
        message: reply,
        explores: [],
      };
    }
    if (payload.questionId?.trim()) {
      await this.questionService.markCarried(payload.questionId.trim(), true);
    }
    const question = await this.persistGuidedTurn({
      chatId,
      action: 'skip',
      promptSummary: `Skipped: ${questionContext ?? 'unspecified'}; reason: ${reason ?? 'user skipped'}`,
      reply,
      questionPrompt: aiQuestion.prompt,
      questionOptions: aiQuestion.options,
    });
    return {
      chatId,
      stage: 'skip',
      message: reply,
      question,
      explores: [],
    };
  }

  async finalizeGuided(
    chatId: string,
    answers: Record<string, string>,
  ): Promise<GuidedLifecycleResponseDto> {
    const categoryName = await this.resolveCategoryNameByChat(chatId);
    const conversationHistory = await this.buildConversationHistory(chatId);
    const { reply, explores } = await this.aiOrchestrator.runFinalizeExplores({
      categoryName,
      answers,
      conversationHistory,
    });
    await this.conversationService.create({
      chatId,
      action: 'finalize',
      promptSummary: this.answersToSummary(answers),
      aiResponse: reply,
    });

    const persistedExplores = await Promise.all(
      explores.map((item) =>
        this.exploreService.create({
          chatId,
          name: item.name,
          description: item.description,
          url: item.url,
          location: item.location,
          imageUrl: item.imageUrl,
        }),
      ),
    );

    return {
      chatId,
      stage: 'finalize',
      message: reply,
      explores,
      persistedExplores,
    };
  }

  private async resolveCategoryNameByChat(chatId: string): Promise<string> {
    const chat = await this.chatService.findById(chatId).catch(() => null);
    if (!chat?.CategoryId) {
      throw new NotFoundException(`Chat with id '${chatId}' not found or missing category`);
    }
    const category = await this.categoryService.findById(chat.CategoryId).catch(() => null);
    if (!category) {
      throw new NotFoundException(`Category with id '${chat.CategoryId}' not found`);
    }
    return category.name;
  }

  private async persistGuidedTurn(input: {
    chatId: string;
    action: string;
    promptSummary: string;
    reply: string;
    questionPrompt: string;
    questionOptions: string[];
  }) {
    const conversation = await this.conversationService.create({
      chatId: input.chatId,
      action: input.action,
      promptSummary: input.promptSummary,
      aiResponse: input.reply,
    });
    return this.questionService.createQuestionWithOptions({
      conversationId: conversation.Id,
      prompt: input.questionPrompt,
      options: input.questionOptions.length > 0 ? input.questionOptions : ['Option A', 'Option B', 'Option C'],
    });
  }

  private answersToSummary(answers: Record<string, string>): string {
    const entries = Object.entries(answers)
      .filter(([, value]) => value != null && String(value).trim())
      .map(([key, value]) => `${key}: ${String(value).trim()}`);
    return entries.join(', ');
  }

  private async buildConversationHistory(chatId: string): Promise<string> {
    const qaHistory = await this.questionService.buildQuestionAnswerHistory(chatId).catch(() => '');
    const turns = await this.conversationService.findByChatId(chatId).catch(() => []);
    const latestTurns = turns.slice(-20);
    const turnHistory = latestTurns
      .map((turn) => {
        const summary = turn.PromptSummary?.trim() || '';
        const response = turn.AiResponse?.trim() || '';
        return `Action=${turn.Action}; PromptSummary=${summary}; AiResponse=${response}`;
      })
      .join('\n');

    const sections = [
      qaHistory ? `Previous guided Q/A:\n${qaHistory}` : '',
      turnHistory ? `Previous conversation turns:\n${turnHistory}` : '',
    ].filter((v) => Boolean(v));
    if (sections.length === 0) {
      return '';
    }

    const history = sections.join('\n\n');

    // Keep history bounded to avoid prompt bloat.
    return history.slice(-6000);
  }
}
