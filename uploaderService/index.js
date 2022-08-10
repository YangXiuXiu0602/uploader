const fs = require('fs')
const path = require('path')

const Koa = require('koa')
const Router = require('@koa/router')
const koaBody = require('koa-body')
const cors = require('@koa/cors')

const uploader = new Router({
  prefix: '/uploader'
})

const app = new Koa()


uploader.post('/', async (ctx, next) => {
  const { chunk } = ctx.request.files
  const { name, cur} = ctx.request.body
  const chunkDir = `./static/${name}Temp`

  if (fs.existsSync(`./static/${name}`)) {
    ctx.body = {
      code: 'success',
      message: '上传成功'
    }
    return
  }

  if (!fs.existsSync(chunkDir)) {
    try {
      await fs.promises.mkdir(chunkDir)
    } catch (error) {
      console.log(error)
    }
  }

  await fs.promises.rename(`./uploader/${chunk.newFilename}`, `./static/${name}Temp/${name}-${cur}`)

  ctx.body = {
    code: 'success',
    message: '上传成功'
  }
})

uploader.post('/merge', async (ctx, next) => {
  const { name } = ctx.request.body

  const chunkDir = `./static/${name}Temp`
  if (!fs.existsSync(chunkDir)) {
    ctx.body = {
      code: 'success',
      message: '上传成功'
    }
    return
  }
  const files = await fs.promises.readdir(chunkDir)
  await fs.promises.writeFile(`./static/${name}`, "")
  files.forEach((path) => {
    fs.appendFileSync(`./static/${name}`, fs.readFileSync(`${chunkDir}/${path}`))
    fs.unlinkSync(`${chunkDir}/${path}`)
  })

  fs.rmdirSync(`./static/${name}Temp`)

  ctx.body = {
    code: 'success',
    message: '文件合并成功'
  }
})


uploader.get('/', async (ctx, next) => {
  const { name } = ctx.query
  const chunkDir = `./static/${name}`
  ctx.body = {
    code: 'success',
    exist: fs.existsSync(chunkDir)
  }
})

app.use(cors())
app.use(koaBody({
  multipart: true,
  formidable: {
    multiples: true,
    uploadDir: path.join(__dirname, './uploader'),
    keepExtensions: true,
    maxFileSize: 1024 * 1024 * 1024
  }
}))
app.use(uploader.routes())
app.use(uploader.allowedMethods())

app.listen(8888, () => {
  console.log('成功监听8888端口号！')
})