import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.9',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		arinkeby: {
			url: process.env.ARINKEBY_URL || '',
			accounts:
				process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
		},
		rinkeby: {
			url: process.env.RINKEBY_URL || '',
			accounts:
				process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
		},
		kovan: {
			url: process.env.KOVAN_URL || '',
			accounts:
				process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
		},
	},
	etherscan: {
		// apiKey: {
		//   rinkeby: process.env.ETHERSCAN_API_KEY || "",
		//   // arinkeby: process.env.AETHERSCAN_API_KEY || "",
		// },
		apiKey: process.env.AETHERSCAN_API_KEY || '',
	},
	mocha: {
		timeout: 2000000,
	},
	gasReporter: {
		currency: 'USD',
		gasPrice: 21,
	},
};

export default config;
