export function getScript(provider: string, token?: string): string {
  const origins = process.env.ORIGINS || '*'
  const message = token
    ? `success:${JSON.stringify({ provider, token })}`
    : `error:Unauthorized`

  const conditionalMessage =
    !token || origins === '*'
      ? `'${message}'`
      : `("${origins}".split(',').includes(e.origin) ? '${message}' : 'error:Invalid origin')`

  return `<!DOCTYPE html><html><body><script>
  ;((w) => {
    w.addEventListener("message", (e) => {
      w.opener.postMessage(
        'authorization:${provider}:' + ${conditionalMessage},
        e.origin
      )
    }, { once:true })
    w.opener.postMessage("authorizing:${provider}", "*")
  })(window)
  </script></body></html>`
}
