import type { ColumnType } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type StatusEnum = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: Generated<number>;
  postId: number;
  userId: number;
  content: string;
  status: StatusEnum;
  createdAt: ColumnType<Date, Date | string, Date | string>;
}

export interface Measurement {
  id: Generated<number>;
  measureDate: ColumnType<Date, Date | string, Date | string>;
  value: ColumnType<string, number | string, number | string>;
  sensorId: number;
}

export interface Measurements2024Q1 {
  id: Generated<number>;
  measureDate: ColumnType<Date, Date | string, Date | string>;
  value: ColumnType<string, number | string, number | string>;
  sensorId: number;
}

export interface Measurements2024Q2 {
  id: Generated<number>;
  measureDate: ColumnType<Date, Date | string, Date | string>;
  value: ColumnType<string, number | string, number | string>;
  sensorId: number;
}

export interface Post {
  id: Generated<number>;
  userId: number;
  title: string;
  content: string | null;
  publishedAt: ColumnType<Date, Date | string, Date | string> | null;
  viewCount: number;
}

export interface User {
  id: Generated<number>;
  email: string;
  username: string;
  createdAt: ColumnType<Date, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string> | null;
  isActive: boolean;
  metadata: unknown | null;
  tags: string[] | null;
  scores: number[] | null;
}

export interface UserStat {
  id: number | null;
  username: string | null;
  postCount: ColumnType<string, string | number | bigint, string | number | bigint> | null;
  commentCount: ColumnType<string, string | number | bigint, string | number | bigint> | null;
}

export interface UserTagsView {
  id: number | null;
  username: string | null;
  tags: string[] | null;
}

export interface DB {
  comments: Comment;
  measurements: Measurement;
  measurements2024Q1: Measurements2024Q1;
  measurements2024Q2: Measurements2024Q2;
  posts: Post;
  users: User;
  userStats: UserStat;
  userTagsView: UserTagsView;
}
