/**
 * Class: CredentialsStore
 *
 * Given a moduleName and a privateClient, this class provides
 * a getConfig and a setConfig function which you can directly
 * use in your module. It also deals with optional client-side
 * encryption, and exposes a change event for the config you
 * store in it. It assumes your module declares a type
 * called 'config' using BaseClient.declareType. Other than
 * that, you will be able to pretty much expose the three methods
 * directly on your module.
 *
 * Parameters:
 *   moduleName - String, the name of the module in which you are
 *                    using it, but without the "-credentials" suffix.
 *   privClient - The private BaseClient for your module, you get this from
 *                    the callback call in remoteStorage.defineModule
 */
function CredentialsStore(moduleName, privClient) {
  this.algorithmPrefix =  'AES-CCM-128:';
  this.changeHandlers = [];
  this.moduleName = moduleName;
  this.privClient = privClient;

  if (typeof(moduleName) !== 'string') {
    throw new Error('moduleName should be a string');
  }
  if (typeof(privClient) !== 'object') {
    throw new Error('privClient should be a (private) base client');
  }

  privClient.on('change', function(evt) {
    if (evt.path === moduleName + '-config') {
      for (var i = 0, len = this.changeHandlers.length; i < len; i++) {
        this.changeHandlers[i]();
      }
    }
  }.bind(this));
}

/**
 * Function: setConfig
 *
 * Set the config/credentials
 *
 * Parameters:
 *   pwd - String value of the password for client-side encryption, or undefined.
 *   config - object, the config/credentials to be saved.
 *
 * Throws:
 *   'config should be an object'
 *   'please include sjcl.js (the Stanford JS Crypto Library) in your app'
 *   'Schema Not Found' (if you didn't call declareType first)
 *   'Please follow the config schema - (followed by the schema from your declareType)'
 */
CredentialsStore.prototype.setConfig = function(pwd, config) {
  console.log('setConfig', this.moduleName, pwd, config, JSON.stringify(config));

  if (typeof(config) !== 'object') {
    throw 'config should be an object';
  }
  if (pwd && (typeof sjcl === 'undefined')) {
    throw 'please include sjcl.js (the Stanford JS Crypto Library) in your app';
  }
  if (this.moduleName === 'sockethub-credentials' || this.moduleName === 'irc-credentials') {
    config['@context'] = 'http://remotestorage.io/spec/modules/' + this.moduleName + '/credentials';
  } else {
    config['@context'] = 'http://remotestorage.io/spec/modules/' + this.moduleName + '/config';
  }
  var validationResult = this.privClient.validate(config);
  if (!validationResult.valid) {
    return Promise.reject('Please follow the config schema - ' + JSON.stringify(validationResult));
  }
  config = JSON.stringify(config);
  if(typeof(pwd) === 'string') {
    config = this.algorithmPrefix + sjcl.encrypt(pwd, config);
  }
  return this.privClient.storeFile('application/json', this.moduleName + '-config', config);
};

/**
 * Function: getConfig
 *
 * Get the config/credentials
 *
 * Parameters:
 *   pwd - String value of the password for client-side encryption, or undefined.
 *   maxAge - maxAge to pass to baseClient.getFile
 *
 * Throws:
 *   'please include sjcl.js (the Stanford JS Crypto Library) in your app'
 *   'could not decrypt (moduleName)-config with that password'
 *   'could not parse (moduleName)-config as unencrypted JSON'
 *   '(moduleName)-config is encrypted, please specify a password for decryption'
 *   '(moduleName)-config is not encrypted, or encrypted with a different algorithm'
 */
CredentialsStore.prototype.getConfig = function(pwd, maxAge) {
  if (pwd && (typeof sjcl === 'undefined')) {
    throw 'please include sjcl.js (the Stanford JS Crypto Library) in your app';
  }
  return this.privClient.getFile(this.moduleName + '-config', maxAge).then(function(a) {
    if (typeof(a) === 'object' && typeof(a.data) === 'string') {
      if (typeof(pwd) === 'string') {
        if (a.data.substring(0, this.algorithmPrefix.length) !== this.algorithmPrefix) {
          throw this.moduleName + '-config is not encrypted, or encrypted with a different algorithm';
        }
        try {
          a.data = JSON.parse(sjcl.decrypt(pwd, a.data.substring(this.algorithmPrefix.length)));
          delete a.data['@context'];
        } catch(e) {
          throw 'could not decrypt ' + this.moduleName + '-config with that password';
        }
      } else {
        if (a.data.substring(0, this.algorithmPrefix.length) === this.algorithmPrefix) {
          throw this.moduleName + '-config is encrypted, please specify a password for decryption';
        }
        try {
          a.data = JSON.parse(a.data);
          delete a.data['@context'];
        } catch(e) {
          throw 'could not parse ' + this.moduleName + '-config as unencrypted JSON';
        }
      }
    } else {
      throw this.moduleName + '-config not found';
    }
    return a.data;
  }.bind(this));
};

/**
 * Function: onceConfig
 *
 * Get the config/credentials, or wait for it to become available
 *
 * Parameters:
 *   pwd - String value of the password for client-side encryption, or undefined.
 *
 * Throws:
 *   'please include sjcl.js (the Stanford JS Crypto Library) in your app'
 *   'could not decrypt (moduleName)-config with that password'
 *   'could not parse (moduleName)-config as unencrypted JSON'
 *   '(moduleName)-config is encrypted, please specify a password for decryption'
 *   '(moduleName)-config is not encrypted, or encrypted with a different algorithm'
 */
CredentialsStore.prototype.onceConfig = function(pwd) {
  return this.getConfig(pwd, 20000).then(undefined, function(err) {//allow config to be 20 seconds old
    var pending = Promise.defer();
    this.privClient.on('change', function(evt) {
      this.onceConfig(pwd).then(function(data) {
        pending.resolve(data);
      });
    }.bind(this));
    return pending.promise;
  }.bind(this));
};

/**
 * Function: on
 *
 * Register an event handler. Currently only used for change events.
 *
 * Parameters:
 *   eventName - Has to be the String 'change'
 *   handler   - The function that should be called when the config changes.
 *                   It will be called without any arguments.
 */
CredentialsStore.prototype.on = function(eventName, handler) {
  if (eventName === 'change') {
    this.changeHandlers.push(handler);
  }
};

if (typeof(global) !== 'undefined') {
  global.CredentialsStore = CredentialsStore;
}

module.exports = CredentialsStore;
