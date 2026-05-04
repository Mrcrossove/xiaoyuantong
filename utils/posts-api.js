const { request } = require("./api");
const { authRequest, buildAuthHeader, getToken } = require("./mini-auth");

function fetchPostList(params) {
  return request({
    url: "/mini/post/list",
    method: "GET",
    data: params
  });
}

function fetchPostDetail(id) {
  return request({
    url: `/mini/post/detail/${id}`,
    method: "GET",
    header: buildAuthHeader(getToken())
  });
}

function fetchMyPosts() {
  return authRequest({
    url: "/mini/post/my",
    method: "GET"
  });
}

function createPost(payload) {
  return authRequest({
    url: "/mini/post",
    method: "POST",
    data: payload
  });
}

function deletePost(id) {
  return authRequest({
    url: `/mini/post/${id}`,
    method: "DELETE"
  });
}

function togglePostLike(id) {
  return authRequest({
    url: `/mini/post/${id}/like`,
    method: "POST"
  });
}

function fetchPostComments(id) {
  return request({
    url: `/mini/post/${id}/comments`,
    method: "GET"
  });
}

function createPostComment(id, payload) {
  return authRequest({
    url: `/mini/post/${id}/comment`,
    method: "POST",
    data: payload
  });
}

module.exports = {
  fetchPostList,
  fetchPostDetail,
  fetchMyPosts,
  createPost,
  deletePost,
  togglePostLike,
  fetchPostComments,
  createPostComment
};
