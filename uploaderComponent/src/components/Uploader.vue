<script setup>
  import { ref, computed, watch } from 'vue'
  import axios from 'axios'

  import request from '../utils/request'

  const props = defineProps({
    chunkLimit: {
      type: Number,
      default: 10
    },
    url: String,
    mergeUrl: String
  })


  const chunkFileList = ref([])
  const fileData = ref(null)
  const fadePercentage = ref(0)

  const handleChange = async (e) => {
    const [file] = e.target.files
    fileData.value = file
    chunkFileList.value = []
    fadePercentage.value = 0
    createChunkFile()
    if (!await checkFileExist()) {
      await uploaderChunk()
      await mergeChunk()
    }
  }

  const createChunkFile = () => {
    const length = props.chunkLimit
    const size = Math.ceil(fileData.value.size / length)
    for(let i = 0; i < length; i++) {
      const formData = new FormData()
      formData.append('chunk', fileData.value.slice(i * size, (i + 1) * size))
      formData.append('name', fileData.value.name)
      formData.append('cur', i)
      chunkFileList.value.push({
        url: props.url,
        data: formData
      })
    }
  }

  const uploaderChunk = async () => {
    await request.post(chunkFileList.value)
  }

  const mergeChunk = async () => {
    await axios.post(props.mergeUrl, {
      name: fileData.value.name
    })
  }

  const cancelUpload = () => {
    request.cancel()
  }

  const checkFileExist = async () => {
    const result = await axios.get(props.url, {
      params: {
        name: fileData.value.name
      }
    })
    return result.data.exist
  }

  const resumeUploader = async () => {
    if (request.cancelQue().length) {
      await request.resume()
      await mergeChunk()
    }
  }

  const percentage = computed(() => {
    const now = chunkFileList.value.reduce((pre, next) => {
      return pre + (next.percentage || 0) * next.data.get('chunk').size
    }, 0)
    return (fileData.value && Math.floor(now / fileData.value.size)) || 0
  })
  watch(percentage, (val) => {
    if (val > fadePercentage.value) {
      fadePercentage.value = val
    }
  })
</script>

<template>
  <div class="uploader">
    <div class="uploader__btn">
      <input type="file" @change="handleChange" class="inputFile" multiple>
      <button class="uploader_btn">上传文件</button>
    </div>
    <div class="cancel_uploader">
      <button @click="cancelUpload">取消上传</button>
      <button @click="resumeUploader">恢复上传</button>
    </div>
    <div v-if="fileData" class="progress">
      <div :style="{
        width: fadePercentage * 2 + 'px',
        height: '5px',
        background: 'red'
      }"></div>
      {{ fadePercentage }}
    </div>
  </div>
  
</template>

<style scoped>
.uploader__btn {
  width: 200px;
  height: 100px;
  position: relative;
}
.inputFile {
  width: 100%;
  height: 100%;
  opacity: 0;
  position: absolute;
  cursor: pointer;
}
.uploader_btn {
  width: 100%;
  height: 100%;
  background: skyblue;
  border-radius: 20px;
}

.cancel_uploader {
  display: flex;
  width: 200px;
  margin-top: 20px;
  justify-content: space-evenly;
}

.progress {
  margin-top: 10px;
  color: black;
}
</style>
