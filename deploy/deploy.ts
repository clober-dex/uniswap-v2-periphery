import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { getChain, isDevelopmentNetwork } from '@nomicfoundation/hardhat-viem/internal/chains'
import { Address } from 'viem'

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre
  const chain = await getChain(network.provider)
  const deployer = (await getNamedAccounts())['deployer'] as Address

  if (await deployments.getOrNull('UniswapV2Router02')) {
    return
  }

  let factory: Address = '0x'
  let weth: Address = '0x'
  if (chain.id === 146) {
    factory = '0x01D6747dD2d65dDD90FAEC2C84727c2706ee28E2'
    weth = '0xdB78663Ad25D2C684087adF5993530019141E339'
  } else {
    throw new Error('Unknown chain')
  }

  await hre.deployments.deploy('UniswapV2Router02', {
    from: deployer,
    args: [factory, weth],
    log: true,
  })
}

export default deployFunction
