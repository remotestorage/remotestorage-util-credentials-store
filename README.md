<a name="CredentialsStore"></a>

## CredentialsStore
**Kind**: global class  

* [CredentialsStore](#CredentialsStore)
    * [new CredentialsStore(name, privClient)](#new_CredentialsStore_new)
    * [.setConfig(pwd, config)](#CredentialsStore+setConfig)
    * [.getConfig(pwd, maxAge)](#CredentialsStore+getConfig)
    * [.onceConfig(pwd)](#CredentialsStore+onceConfig)
    * [.on(eventName, handler)](#CredentialsStore+on)

<a name="new_CredentialsStore_new"></a>

### new CredentialsStore(name, privClient)
This rs.js module utility class provides a `getConfig` and a `setConfig`
function which you can directly use in your module. It also deals with
optional client-side encryption, and exposes a change event for the config
you store in it. It assumes your module declares a type called `config`
using `BaseClient.declareType`. Other than that, you will be able to pretty
much expose the three methods directly on your module.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | the name of the module in which you are using it, but without the "-credentials" suffix. |
| privClient | <code>Object</code> | The private `BaseClient` for your module. You get this from the callback call in `remoteStorage.defineModule` |

<a name="CredentialsStore+setConfig"></a>

### credentialsStore.setConfig(pwd, config)
Set the config/credentials

**Kind**: instance method of [<code>CredentialsStore</code>](#CredentialsStore)  
**Throws**:

- An error with one of these messages:
    - 'config should be an object'
    - 'Schema Not Found' (if you didn't call declareType first)
    - 'Please follow the config schema - (followed by the schema from your declareType)'


| Param | Type | Description |
| --- | --- | --- |
| pwd | <code>String</code> | String value of the password for client-side encryption, or undefined. |
| config | <code>Object</code> | The config/credentials to be saved. |

<a name="CredentialsStore+getConfig"></a>

### credentialsStore.getConfig(pwd, maxAge)
Get the config/credentials

**Kind**: instance method of [<code>CredentialsStore</code>](#CredentialsStore)  
**Throws**:

- An error with one of these messages:
    - 'could not decrypt (moduleName)-config with that password'
    - 'could not parse (moduleName)-config as unencrypted JSON'
    - '(moduleName)-config is encrypted, please specify a password for decryption'
    - '(moduleName)-config is not encrypted, or encrypted with a different algorithm'


| Param | Type | Description |
| --- | --- | --- |
| pwd | <code>String</code> | String value of the password for client-side encryption, or undefined. |
| maxAge | <code>String</code> | `maxAge` to pass to `baseClient.getFile` |

<a name="CredentialsStore+onceConfig"></a>

### credentialsStore.onceConfig(pwd)
Get the config/credentials, or wait for it to become available

**Kind**: instance method of [<code>CredentialsStore</code>](#CredentialsStore)  
**Throws**:

- An error with one of these messages:
    - 'could not decrypt (moduleName)-config with that password'
    - 'could not parse (moduleName)-config as unencrypted JSON'
    - '(moduleName)-config is encrypted, please specify a password for decryption'
    - '(moduleName)-config is not encrypted, or encrypted with a different algorithm'


| Param | Type | Description |
| --- | --- | --- |
| pwd | <code>String</code> | String value of the password for client-side encryption, or undefined. |

<a name="CredentialsStore+on"></a>

### credentialsStore.on(eventName, handler)
Register an event handler. Currently only used for change events.

**Kind**: instance method of [<code>CredentialsStore</code>](#CredentialsStore)  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | Has to be the String 'change' |
| handler | <code>function</code> | The function that should be called when the config changes. It will be called without any arguments. |

