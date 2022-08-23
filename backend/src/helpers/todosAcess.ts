import * as AWS from 'aws-sdk'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'; 
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Types } from 'aws-sdk/clients/s3';


// TODO: Implement the dataLayer logic
export class TodoAccess {
  constructor(
      private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
      private readonly s3Client: Types = new AWS.S3({ signatureVersion: 'v4' }),
      private readonly todoTable = process.env.TODOS_TABLE,
      private readonly s3BucketName = process.env.S3_BUCKET_NAME) {
  }

  async getAllTodo(userId: string): Promise<TodoItem[]> {
      console.log("Getting all todo");
      const params = {
          TableName: this.todoTable,
          KeyConditionExpression: "#userId = :userId",
          ExpressionAttributeNames: {
              "#userId": "userId"
          },
          ExpressionAttributeValues: {
              ":userId": userId
          }
      };

      const result = await this.docClient.query(params).promise();
      const items = result.Items;
      return items as TodoItem[];
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
      console.log("Creating new todo");

      const params = {
          TableName: this.todoTable,
          Item: todoItem,
      };

      await this.docClient.put(params).promise();
      return todoItem as TodoItem;
  }

  async updateTodo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
      console.log("Updating todo");

      const params = {
          TableName: this.todoTable,
          Key: {
              "userId": userId,
              "todoId": todoId
          },
          UpdateExpression: "set #a = :a, #b = :b, #c = :c",
          ExpressionAttributeNames: {
              "#a": "name",
              "#b": "dueDate",
              "#c": "done"
          },
          ExpressionAttributeValues: {
              ":a": todoUpdate['name'],
              ":b": todoUpdate['dueDate'],
              ":c": todoUpdate['done']
          },
          ReturnValues: "ALL_NEW"
      };

      const result = await this.docClient.update(params).promise();
      const attributes = result.Attributes;
      return attributes as TodoUpdate;
  }

  async deleteTodo(todoId: string, userId: string): Promise<string> {
      console.log("Deleting todo");

      const params = {
          TableName: this.todoTable,
          Key: {
              "userId": userId,
              "todoId": todoId
          },
      };

      const result = await this.docClient.delete(params).promise();
      console.log(result);
      return "Deleted successfully." as string;
  }

  async generateUploadUrl(todoId: string): Promise<string> {
      console.log("Generating URL");

      const url = this.s3Client.getSignedUrl('putObject', {
          Bucket: this.s3BucketName,
          Key: todoId,
          Expires: 1000,
      }); 
      return url as string;
  }
}

