const { authRequest } = require("./mini-auth");

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

function compressImage(filePath, quality) {
  return new Promise((resolve) => {
    if (!wx.compressImage) {
      resolve(filePath);
      return;
    }

    wx.compressImage({
      src: filePath,
      quality,
      success(res) {
        resolve(res.tempFilePath || filePath);
      },
      fail() {
        resolve(filePath);
      }
    });
  });
}

function readFileAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath,
      encoding: "base64",
      success(res) {
        resolve(res.data || "");
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

async function prepareUploadImage(filePath) {
  let targetPath = filePath;
  let info = await getFileInfo(targetPath);

  if (info.size > 2 * 1024 * 1024) {
    targetPath = await compressImage(targetPath, 70);
    info = await getFileInfo(targetPath);
  }

  if (info.size > 7.5 * 1024 * 1024) {
    targetPath = await compressImage(targetPath, 45);
    info = await getFileInfo(targetPath);
  }

  if (info.size > 7.5 * 1024 * 1024) {
    throw new Error("图片过大，请压缩后再上传");
  }

  return targetPath;
}

async function uploadImage(filePath, scene = "post") {
  const uploadPath = await prepareUploadImage(filePath);
  const base64 = await readFileAsBase64(uploadPath);
  const fileName = uploadPath.split("/").pop() || `image_${Date.now()}.jpg`;
  return authRequest({
    url: "/mini/upload/image",
    method: "POST",
    timeout: 30000,
    data: {
      fileName,
      base64: `data:image/jpeg;base64,${base64}`,
      scene
    }
  });
}

module.exports = {
  uploadImage
};
