const { authRequest } = require("./mini-auth");

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileInfo({
      filePath,
      success(res) {
        resolve(res);
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

function readFileAsArrayBuffer(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      success(res) {
        resolve(res.data);
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

function getMimeType(filePath) {
  const normalized = String(filePath || "").split("?")[0].toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function uploadToCos(ticket, filePath, fileData) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: ticket.uploadUrl,
      method: ticket.method || "PUT",
      data: fileData,
      header: ticket.headers || {},
      timeout: 60000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(ticket);
          return;
        }

        reject(new Error(`COS上传失败(${res.statusCode})`));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

async function uploadImage(filePath, scene = "post") {
  const info = await getFileInfo(filePath);
  if (info.size > MAX_IMAGE_SIZE) {
    throw new Error("单张图片不能超过 8MB");
  }

  const fileName = filePath.split("/").pop() || `image_${Date.now()}.jpg`;
  const mimeType = getMimeType(fileName);
  const ticket = await authRequest({
    url: "/mini/upload/cos-ticket",
    method: "POST",
    data: {
      fileName,
      mimeType,
      size: info.size,
      scene
    }
  });

  const fileData = await readFileAsArrayBuffer(filePath);
  await uploadToCos(ticket, filePath, fileData);

  return {
    fileName: ticket.fileName,
    url: ticket.url,
    size: info.size,
    storageKey: ticket.key,
    provider: ticket.provider || "tencent_cos"
  };
}

module.exports = {
  uploadImage
};
