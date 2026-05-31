import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../config/database';
import { Priority, TaskStatus } from '../../../domain/enums';

interface TaskAttributes {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  assigneeId?: string;
  creatorId: string;
  organizationId: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'priority' | 'status'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: string;
  public title!: string;
  public description?: string;
  public priority!: Priority;
  public status!: TaskStatus;
  public assigneeId?: string;
  public creatorId!: string;
  public organizationId!: string;
  public dueDate?: Date;
  public completedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(Priority)),
      allowNull: false,
      defaultValue: Priority.MEDIUM,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TaskStatus)),
      allowNull: false,
      defaultValue: TaskStatus.TODO,
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assignee_id',
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'creator_id',
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['assignee_id'],
      },
      {
        fields: ['due_date'],
      },
      {
        fields: ['organization_id'],
      },
      {
        fields: ['organization_id', 'status'],
      },
    ],
  }
);

export default Task;
