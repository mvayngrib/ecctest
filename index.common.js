/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import './shim'
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage
} from 'react-native';

import ecc from 'react-native-ecc'
ecc.setServiceID('myappname')
import { Buffer } from 'buffer'

const keySpecs = [
  { purpose: 'signStuff', curve: 'p256' },
  { purpose: 'signOtherStuff', curve: 'p256' },
]

const algorithm = 'sha256'

class ecctest extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  componentWillMount() {
    AsyncStorage.getItem('keys')
      .then(keys => keys ? loadKeys(JSON.parse(keys)) : createKeys(keySpecs))
      .then(keys => {
        const pubs = keys.map(k => k.pub.toString('base64'))
        this.setState({ keys: pubs })
        const key = keys[0]
        return ninvoke(key, 'sign', {
          pubKey: keys[0].pub,
          data: new Buffer('some data'),
          algorithm: algorithm
        })
      })
      .then(sig => {
        sig = sig.toString('base64')
        this.setState({ sig })
      })
  }
  render() {
    const keys = this.state.keys || []
    const sig = this.state.sig || ''
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, use these keys: {JSON.stringify(keys, null, 2)}
        </Text>
        <Text style={styles.instructions}>
          here's a signature: {sig}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('ecctest', () => ecctest);

function createKeys (specs) {
  return Promise.all(specs.map(k => {
    return ninvoke(ecc, 'keyPair', k.curve)
  }))
  .then(keys => {
    return savePubKeys(keys)
      .then(() => keys)
  })
}

function loadKeys (keys) {
  return keys.map(k => ecc.keyFromPublic(new Buffer(k, 'base64')))
}

function savePubKeys (keys) {
  const encoded = keys.map(k => k.pub.toString('base64'))
  return AsyncStorage.setItem('keys', JSON.stringify(encoded))
}

function ninvoke (obj, method, ...args) {
  return new Promise((resolve, reject) => {
    args = args.slice()
    args.push(function (err, result) {
      if (err) return reject(err)
      else resolve(result)
    })

    obj[method](...args)
  })
}
