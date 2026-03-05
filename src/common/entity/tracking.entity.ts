import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Base template for entities that need common tracking fields.
 * Not a standalone table; other entities should extend this class.
 */
export abstract class Tracking {
  @PrimaryGeneratedColumn('uuid')
  Id!: string;

  @CreateDateColumn()
  CreatedAt!: Date;

  @UpdateDateColumn()
  UpdatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  DeletedAt?: Date;
}
