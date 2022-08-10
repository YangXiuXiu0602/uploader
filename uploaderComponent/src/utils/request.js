import axios from 'axios'

class Request {
  constructor(limit, onUploadeFn) {
    this.limit = limit
    this.queue = []
    this.waitQue = []
    this.onUploadeFn = onUploadeFn
    this.abort = null
  }

  async post(queue) {
    const stack = [...queue]
    this.queue = stack.splice(0, this.limit)
    this.waitQue = stack
    this.abort = new AbortController()
    this.queue.forEach((item, index) => {
      this.start(item, index)
    })
    this.mergePromise = new Promise((res, rej) => {
      this.resolve = res
      this.reject = rej
    })
    return this.mergePromise
  }

  start(item, index) {
    axios.post(item.url, item.data, {
      signal: this.abort.signal,
      onUploadProgress: (e) => {
        this.onUploadeFn(e, item)
      }
    }).then(() => {
      if (this.waitQue.length) {
        const next = this.waitQue.shift()
        this.queue.splice(index, 1, next)
        this.start(next, index)
      } else{
        this.queue[index].done = true
        if (!this.cancelQue().length) {
          this.resolve()
        }
      }
    })
  }

  cancelQue() {
    if (this.waitQue.length) {
      return this.waitQue.concat(this.queue)
    } else {
      return this.queue.filter(item => !item.done)
    }
  }

  cancel() {
    this.abort && this.abort.abort()
  }

  async resume() {
    const list = this.cancelQue()
    await this.post(list)
  }
}


export default new Request(5, (e, item) => {
  item.percentage = parseInt((e.loaded / e.total) * 100)
})