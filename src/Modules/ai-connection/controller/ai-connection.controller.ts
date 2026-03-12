import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AiConnectionService } from '../service/ai-connection.service.js';
import { CreateAiConnectionDto } from '../dto/create-ai-connection.dto.js';

@Controller('ai/connections')
export class AiConnectionController {
  constructor(private readonly aiConnectionService: AiConnectionService) {}

  /** Lists all saved AI connections (keys are masked). */
  @Get()
  getAll() {
    return this.aiConnectionService.listAll();
  }

  /** Adds a new AI connection key (encrypted at rest). */
  @Post()
  create(@Body() body: CreateAiConnectionDto) {
    return this.aiConnectionService.create(body);
  }

  /** Switches active connection to the selected one. */
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.aiConnectionService.activate(id);
  }
}
