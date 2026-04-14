const { authRequest } = require("./mini-auth");

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

async function uploadImage(filePath, scene = "post") {
  const base64 = await readFileAsBase64(filePath);
  const fileName = filePath.split("/").pop() || `image_${Date.now()}.jpg`;
  return authRequest({
    url: "/mini/upload/image",
    method: "POST",
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
