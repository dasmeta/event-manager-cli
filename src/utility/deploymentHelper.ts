import { FunctionItem, GcfFunctionList } from "../interfaces";

export const getGcfState = (stateFilePath:string) => {
  const list: GcfFunctionList = require(stateFilePath)

  const data = {}
  list.forEach(item => {
    const functionName: string = item.name.split("/functions/").pop()!
    if (functionName !== undefined) {
      // @ts-ignore
      data[functionName] = item.labels || {}
    }
  })

  return data
}

export const getFunctionDeploymentScript = (item: FunctionItem) => {
  let content = ''
  content += `\ngcloud beta functions deploy "${item.functionName}" \\`
  content += `\n  --region="europe-west1" \\`
  content += `\n  --entry-point="subscribe" \\`
  content += `\n  --memory="${item.memory || "128MB"}" \\`
  content += `\n  --max-instances=${item["max-instances"] || "1"} \\`
  content += `\n  --runtime="nodejs12" \\`
  content += `\n  --source="${item.absolutePath}" \\`
  content += `\n  --timeout=60 \\`

  if (item.topic) {
    content += `\n  --trigger-topic="${item.topic}" \\`
  }
  if (item.bucket) {
    content += `\n  --trigger-bucket="${item.bucket}" \\`
  }
  if (item.event) {
    content += `\n  --trigger-event="${item.event}" \\`
  }
  if (item.resource) {
    content += `\n  --trigger-resource="${item.resource}" \\`
  }

  content += `\n  --update-labels="type=event,version=${item.version}" \\`
  content += `\n  --env-vars-file="env.yml" &\n`

  return content
}
