import {
	time,
	loadFixture,
	mine,
	mineUpTo,
} from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('Governor', () => {
	const deploy = async () => {
		const [owner, ...addrs] = await ethers.getSigners();

		const Token = await ethers.getContractFactory('MyToken');
		const token = await Token.deploy();
		await token.deployed();

		const TimelockControl = await ethers.getContractFactory(
			'TimelockController'
		);
		const timelockController = await TimelockControl.deploy(
			100,
			[addrs[0].address],
			[addrs[1].address]
		);
		await timelockController.deployed();

		const Governor = await ethers.getContractFactory('MyGovernor');
		const governor = await Governor.deploy(
			token.address,
			timelockController.address
		);
		await governor.deployed();

		let executorrole = await timelockController.EXECUTOR_ROLE();
		let proposerrole = await timelockController.PROPOSER_ROLE();
		await (
			await timelockController.grantRole(executorrole, governor.address)
		).wait();
		await (
			await timelockController.grantRole(proposerrole, governor.address)
		).wait();

		await (await token.delegate(owner.address)).wait();
		await (await token.connect(addrs[0]).delegate(addrs[0].address)).wait();
		await (await token.connect(addrs[1]).delegate(addrs[1].address)).wait();

		return { token, timelockController, governor, owner, addrs };
	};

	describe('first', () => {
		it('success deployed', async () => {
			const { token, timelockController, governor, owner, addrs } =
				await loadFixture(deploy);

			let lasttime = await time.latest();
			console.log('lasttime = ', lasttime);

			expect(await token.balanceOf(owner.address)).to.be.eq(
				ethers.utils.parseEther('100')
			);

			await (
				await token.transfer(addrs[0].address, ethers.utils.parseEther('10'))
			).wait();

			await (
				await token.transfer(
					timelockController.address,
					ethers.utils.parseEther('10')
				)
			).wait();

			let blocknumber = await ethers.provider.getBlockNumber();
			// console.log('blocknumber = ', blocknumber.toString());
			let quorum = await governor.quorum(blocknumber - 1);
			// console.log('quorum = ', quorum.toString());
			expect(quorum).to.be.eq(ethers.utils.parseEther('100').mul(4).div(100));
			let numcheckpoints = await token.numCheckpoints(owner.address);
			console.log('numcheckpoints = ', numcheckpoints.toString());
			let checkpoint = await token.checkpoints(owner.address, 2);
			console.log('checkpoint = ', checkpoint);
			await time.increase(100);
			let votes = await governor.getVotes(owner.address, blocknumber);
			console.log('votes = ', votes.toString());

			const transferCalldata = token.interface.encodeFunctionData('transfer', [
				addrs[2].address,
				ethers.utils.parseEther('10'),
			]);
			console.log('proposing ...');
			await (
				await governor
					.connect(addrs[0])
					['propose(address[],uint256[],bytes[],string)'](
						[token.address],
						[0],
						[transferCalldata],
						'Proposal #1: Give grant to team'
					)
			).wait();

			const descriptionHash = ethers.utils.id(
				'Proposal #1: Give grant to team'
			);
			const proposalId = await governor.hashProposal(
				[token.address],
				[0],
				[transferCalldata],
				descriptionHash
			);
			console.log('proposalId = ', proposalId.toString());
			await mineUpTo(52650 + 1);
			let delay = await governor.votingDelay();
			let period = await governor.votingPeriod();
			console.log('delay and period = ', delay.toString(), period.toString());
			let state = await governor.state(proposalId);
			console.log('state = ', state);
			await (await governor.connect(addrs[0]).castVote(proposalId, 1)).wait();
			await mineUpTo(52659 + 1);
			state = await governor.state(proposalId);
			console.log('state = ', state);
			console.log('queueing ...');
			await (
				await governor
					.connect(addrs[0])
					['queue(address[],uint256[],bytes[],bytes32)'](
						[token.address],
						[0],
						[transferCalldata],
						descriptionHash
					)
			).wait();
			state = await governor.state(proposalId);
			console.log('state = ', state);
			await time.increase(100);
			console.log('executing ...');
			await (
				await governor
					.connect(addrs[1])
					['execute(address[],uint256[],bytes[],bytes32)'](
						[token.address],
						[0],
						[transferCalldata],
						descriptionHash
					)
			).wait();
		});
	});
});
