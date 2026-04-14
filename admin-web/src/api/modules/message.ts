import type {
  AdminInteractiveMessageListResult,
  AdminInteractiveMessageQuery,
  AdminSendRecordListResult,
  AdminSendRecordQuery,
  AdminSystemMessageListResult,
  AdminSystemMessageQuery,
  MessageTemplateItem,
  MessageTemplateListResult,
  MessageTemplatePayload,
  MessageTemplateQuery
} from "../contracts";
import { request } from "../request";

export function getAdminSystemMessageListApi(query: AdminSystemMessageQuery) {
  return request<AdminSystemMessageListResult>({
    url: "/message/admin/system/list",
    method: "GET",
    params: query
  });
}

export function getAdminSendRecordListApi(query: AdminSendRecordQuery) {
  return request<AdminSendRecordListResult>({
    url: "/message/admin/send/list",
    method: "GET",
    params: query
  });
}

export function getInteractiveMessagesApi(query: AdminInteractiveMessageQuery) {
  return request<AdminInteractiveMessageListResult>({
    url: "/message/admin/interactive/list",
    method: "GET",
    params: query
  });
}

export function getMessageTemplatesApi(query: MessageTemplateQuery) {
  return request<MessageTemplateListResult>({
    url: "/message/admin/template/list",
    method: "GET",
    params: query
  });
}

export function createMessageTemplateApi(payload: MessageTemplatePayload) {
  return request<MessageTemplateItem>({
    url: "/message/admin/template",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateMessageTemplateApi(id: number, payload: MessageTemplatePayload) {
  return request<MessageTemplateItem>({
    url: `/message/admin/template/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleMessageTemplateStatusApi(id: number) {
  return request<MessageTemplateItem>({
    url: `/message/admin/template/${id}/toggle-status`,
    method: "PATCH"
  });
}

export function deleteMessageTemplateApi(id: number) {
  return request<{ success: boolean }>({
    url: `/message/admin/template/${id}`,
    method: "DELETE"
  });
}
