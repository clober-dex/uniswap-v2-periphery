import path from 'path'
import fs from 'fs'

import * as dotenv from 'dotenv'
import readlineSync from 'readline-sync'

import 'hardhat-deploy'
import '@nomicfoundation/hardhat-viem'

import { HardhatConfig } from 'hardhat/types'
import * as networkInfos from 'viem/chains'

dotenv.config()

const chainIdMap: { [key: string]: string } = {}
for (const [networkName, networkInfo] of Object.entries(networkInfos)) {
  // @ts-ignore
  chainIdMap[networkInfo.id] = networkName
}

const SKIP_LOAD = process.env.SKIP_LOAD === 'true'

// Prevent to load scripts before compilation
if (!SKIP_LOAD) {
  const tasksPath = path.join(__dirname, 'task')
  if (fs.existsSync(tasksPath)) {
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes('.ts'))
      .forEach((task) => {
        require(`${tasksPath}/${task}`)
      })
  }
}

let privateKey: string
let ok: string

const loadPrivateKeyFromKeyfile = () => {
  let network
  for (const [i, arg] of Object.entries(process.argv)) {
    if (arg === '--network') {
      network = parseInt(process.argv[parseInt(i) + 1])
      if (network.toString() in chainIdMap && ok !== 'Y') {
        ok = readlineSync.question(`You are trying to use ${chainIdMap[network.toString()]} network [Y/n] : `)
        if (ok !== 'Y') {
          throw new Error('Network not allowed')
        }
      }
    }
  }

  const prodNetworks = new Set<number>([networkInfos.mainnet.id, networkInfos.arbitrum.id, networkInfos.base.id])
  if (network && prodNetworks.has(network)) {
    if (privateKey) {
      return privateKey
    }
    const keythereum = require('keythereum')

    const KEYSTORE = './deployer-key.json'
    const PASSWORD = readlineSync.question('Password: ', {
      hideEchoBack: true,
    })
    if (PASSWORD !== '') {
      const keyObject = JSON.parse(fs.readFileSync(KEYSTORE).toString())
      privateKey = '0x' + keythereum.recover(PASSWORD, keyObject).toString('hex')
    } else {
      privateKey = '0x0000000000000000000000000000000000000000000000000000000000000001'
    }
    return privateKey
  }
  return '0x0000000000000000000000000000000000000000000000000000000000000001'
}

const config: HardhatConfig = {
  solidity: {
    compilers: [
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
    overrides: {},
  },
  defaultNetwork: 'hardhat',
  networks: {
    // [networkInfos.fantomSonicTestnet.id]: {
    //   url: networkInfos.sonicTestnet.rpcUrls.default.http[0],
    //   chainId: networkInfos.sonicTestnet.id,
    //   accounts: process.env.DEV_PRIVATE_KEY ? [process.env.DEV_PRIVATE_KEY] : [],
    //   gas: 'auto',
    //   gasPrice: 'auto',
    //   gasMultiplier: 1,
    //   timeout: 3000000,
    //   httpHeaders: {},
    //   live: true,
    //   saveDeployments: true,
    //   tags: ['testnet', 'test'],
    //   companionNetworks: {},
    // },
    hardhat: {
      chainId: networkInfos.hardhat.id,
      gas: 20000000,
      gasPrice: 250000000000,
      gasMultiplier: 1,
      // @ts-ignore
      // forking: {
      //   enabled: true,
      //   url: 'ARCHIVE_NODE_URL',
      // },
      mining: {
        auto: true,
        interval: 0,
        mempool: {
          order: 'fifo',
        },
      },
      accounts: {
        mnemonic: 'loop curious foster tank depart vintage regret net frozen version expire vacant there zebra world',
        initialIndex: 0,
        count: 10,
        path: "m/44'/60'/0'/0",
        accountsBalance: '10000000000000000000000000000',
        passphrase: '',
      },
      blockGasLimit: 200000000,
      // @ts-ignore
      minGasPrice: undefined,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      initialDate: new Date().toISOString(),
      loggingEnabled: false,
      // @ts-ignore
      chains: undefined,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  abiExporter: [
    // @ts-ignore
    {
      path: './abi',
      runOnCompile: false,
      clear: true,
      flat: true,
      only: [],
      except: [],
      spacing: 2,
      pretty: false,
      filter: () => true,
    },
  ],
  // @ts-ignore
  contractSizer: {
    runOnCompile: true,
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY ?? '',
      sepolia: process.env.ARBISCAN_API_KEY ?? '',
      arbitrumSepolia: process.env.ARBISCAN_API_KEY ?? '',
      [networkInfos.berachainTestnet.id]: 'berachainArtio',
    },
    customChains: [
      {
        network: networkInfos.berachainTestnet.id.toString(),
        chainId: networkInfos.berachainTestnet.id,
        urls: {
          apiURL: 'https://api.routescan.io/v2/network/testnet/evm/80085/etherscan',
          browserURL: 'https://artio.beratrail.io/',
        },
      },
    ],
    enabled: true,
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true,
  },
}

export default config
