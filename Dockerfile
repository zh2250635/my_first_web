# 使用node20.8.1-alpine作为基础镜像
# 第一阶段：基于Node.js的Alpine版本构建依赖
FROM node:20.8.1-alpine as builder

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json到工作目录
COPY package*.json ./

# 安装依赖
RUN npm install && npm cache clean --force

# 复制所有文件到工作目录，除了.dockerignore中指定的文件
COPY . .

# 第二阶段：从builder阶段复制必要的文件
FROM node:20.8.1-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 从builder阶段复制构建的结果
COPY --from=builder /usr/src/app .

#环境变量
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 指定运行时命令
CMD ["node", "app.js"]
