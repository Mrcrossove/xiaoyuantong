import { request } from "../request";

export interface StatCard {
  label: string;
  value: number | string;
  trend: string;
}

export interface SchoolRankItem {
  school: string;
  value: number;
}

export interface CategoryRankItem {
  name: string;
  value: number;
}

export interface UserStatResult {
  cards: StatCard[];
  schoolRank: SchoolRankItem[];
}

export interface PostStatResult {
  cards: StatCard[];
  categoryRank: CategoryRankItem[];
}

export interface StoreStatResult {
  cards: StatCard[];
  schoolRank: SchoolRankItem[];
}

export interface OrderStatResult {
  cards: StatCard[];
  schoolRank: SchoolRankItem[];
}

export function getUserStatApi() {
  return request<UserStatResult>({
    url: "/stat/admin/user",
    method: "GET"
  });
}

export function getPostStatApi() {
  return request<PostStatResult>({
    url: "/stat/admin/post",
    method: "GET"
  });
}

export function getStoreStatApi() {
  return request<StoreStatResult>({
    url: "/stat/admin/store",
    method: "GET"
  });
}

export function getOrderStatApi() {
  return request<OrderStatResult>({
    url: "/stat/admin/order",
    method: "GET"
  });
}
