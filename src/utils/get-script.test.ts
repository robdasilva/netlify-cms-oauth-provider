import { getScript } from './get-script'

describe('getScript', () => {
  beforeEach(() => {
    process.env.ORIGINS = 'example.com,www.example.com'
  })

  afterEach(() => {
    delete process.env.ORIGINS
  })

  it('returns HTML snippet for authorization success if token provided', () => {
    const provider = 'jest'
    const token = 'unit-test'

    expect(getScript(provider, token)).toMatchInlineSnapshot(`
      "<!DOCTYPE html><html><body><script>
        ;((w) => {
          w.addEventListener(\\"message\\", (e) => {
            w.opener.postMessage(
              'authorization:jest:' + (\\"example.com,www.example.com\\".split(',').includes(e.origin) ? 'success:{\\"provider\\":\\"jest\\",\\"token\\":\\"unit-test\\"}' : 'error:Invalid origin'),
              e.origin
            )
          }, { once:true })
          w.opener.postMessage(\\"authorizing:jest\\", \\"*\\")
        })(window)
        </script></body></html>"
    `)
  })

  it('returns HTML snippet for authorization success for all origins', () => {
    const provider = 'jest'
    const token = 'unit-test'

    process.env.ORIGINS = '*'

    expect(getScript(provider, token)).toMatchInlineSnapshot(`
      "<!DOCTYPE html><html><body><script>
        ;((w) => {
          w.addEventListener(\\"message\\", (e) => {
            w.opener.postMessage(
              'authorization:jest:' + 'success:{\\"provider\\":\\"jest\\",\\"token\\":\\"unit-test\\"}',
              e.origin
            )
          }, { once:true })
          w.opener.postMessage(\\"authorizing:jest\\", \\"*\\")
        })(window)
        </script></body></html>"
    `)
  })

  it('returns HTML snippet for authorization success for all origins if allowed origins are not specified', () => {
    const provider = 'jest'
    const token = 'unit-test'

    delete process.env.ORIGINS

    expect(getScript(provider, token)).toMatchInlineSnapshot(`
      "<!DOCTYPE html><html><body><script>
        ;((w) => {
          w.addEventListener(\\"message\\", (e) => {
            w.opener.postMessage(
              'authorization:jest:' + 'success:{\\"provider\\":\\"jest\\",\\"token\\":\\"unit-test\\"}',
              e.origin
            )
          }, { once:true })
          w.opener.postMessage(\\"authorizing:jest\\", \\"*\\")
        })(window)
        </script></body></html>"
    `)
  })

  it('returns HTML snippet for authorization error if no token provided', () => {
    const provider = 'jest'

    expect(getScript(provider)).toMatchInlineSnapshot(`
      "<!DOCTYPE html><html><body><script>
        ;((w) => {
          w.addEventListener(\\"message\\", (e) => {
            w.opener.postMessage(
              'authorization:jest:' + 'error:Unauthorized',
              e.origin
            )
          }, { once:true })
          w.opener.postMessage(\\"authorizing:jest\\", \\"*\\")
        })(window)
        </script></body></html>"
    `)
  })
})
