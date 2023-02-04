import type Task from "./Task";

export default interface Collection {
  buckets: Bucket[];
};

interface Bucket {
  name: string;
  tasks: Task[];
}