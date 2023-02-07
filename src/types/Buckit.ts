import type Task from "./Task";

export default interface Buckit {
  name: string;
  tasks: Task[];
  timestamp: number;
}