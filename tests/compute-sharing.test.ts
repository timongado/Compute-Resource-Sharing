import {describe, it, expect, beforeEach} from 'vitest';

// Mock Clarity contract state
let providers = new Map ();
let consumers = new Map ();
let activeJobs = new Map ();
let lastJobId = 0;

// Mock Clarity functions
function registerProvider (caller: string, resources: number, pricePerUnit: number): { type: string; value: boolean } {
	if (providers.has (caller)) {
		return {type: 'err', value: 103}; // err-already-exists
	}
	providers.set (caller, {resources, pricePerUnit, earnings: 0});
	return {type: 'ok', value: true};
}

function updateProvider (caller: string, resources: number, pricePerUnit: number): { type: string; value: boolean } {
	if ( ! providers.has (caller)) {
		return {type: 'err', value: 101}; // err-not-found
	}
	const provider = providers.get (caller);
	provider.resources = resources;
	provider.pricePerUnit = pricePerUnit;
	providers.set (caller, provider);
	return {type: 'ok', value: true};
}

function addFunds (caller: string, amount: number): { type: string; value: boolean } {
	const consumerData = consumers.get (caller) || {balance: 0};
	consumerData.balance += amount;
	consumers.set (caller, consumerData);
	return {type: 'ok', value: true};
}

function requestCompute (caller: string, provider: string, resources: number): {
	type: string;
	value: number | string
} {
	const providerData = providers.get (provider);
	if ( ! providerData) {
		return {type: 'err', value: 101}; // err-not-found
	}
	const consumerData = consumers.get (caller) || {balance: 0};
	const totalCost = resources * providerData.pricePerUnit;
	if (providerData.resources < resources) {
		return {type: 'err', value: 104}; // err-invalid-amount
	}
	if (consumerData.balance < totalCost) {
		return {type: 'err', value: 105}; // err-insufficient-balance
	}
	const newJobId = ++ lastJobId;
	activeJobs.set (newJobId, {
		consumer: caller,
		provider: provider,
		resources: resources,
		totalCost: totalCost,
		status: "active"
	});
	providerData.resources -= resources;
	consumerData.balance -= totalCost;
	providers.set (provider, providerData);
	consumers.set (caller, consumerData);
	return {type: 'ok', value: newJobId};
}

function completeJob (caller: string, jobId: number): { type: string; value: boolean } {
	const job = activeJobs.get (jobId);
	if ( ! job) {
		return {type: 'err', value: 101}; // err-not-found
	}
	if (job.provider !== caller) {
		return {type: 'err', value: 102}; // err-unauthorized
	}
	if (job.status !== "active") {
		return {type: 'err', value: 102}; // err-unauthorized
	}
	job.status = "completed";
	activeJobs.set (jobId, job);
	const providerData = providers.get (caller);
	providerData.resources += job.resources;
	providerData.earnings += job.totalCost;
	providers.set (caller, providerData);
	return {type: 'ok', value: true};
}

function withdrawEarnings (caller: string): { type: string; value: number } {
	const providerData = providers.get (caller);
	if ( ! providerData) {
		return {type: 'err', value: 101}; // err-not-found
	}
	if (providerData.earnings === 0) {
		return {type: 'err', value: 104}; // err-invalid-amount
	}
	const earnings = providerData.earnings;
	providerData.earnings = 0;
	providers.set (caller, providerData);
	return {type: 'ok', value: earnings};
}

describe ('Decentralized Compute Resource Sharing', () => {
	beforeEach (() => {
		providers.clear ();
		consumers.clear ();
		activeJobs.clear ();
		lastJobId = 0;
	});
	
	it ('should allow providers to register', () => {
		const result = registerProvider ('provider1', 1000, 10);
		expect (result.type).toBe ('ok');
		expect (result.value).toBe (true);
		const providerData = providers.get ('provider1');
		expect (providerData).toBeDefined ();
		expect (providerData.resources).toBe (1000);
		expect (providerData.pricePerUnit).toBe (10);
	});
	
	it ('should allow providers to update their data', () => {
		registerProvider ('provider1', 1000, 10);
		const result = updateProvider ('provider1', 1500, 15);
		expect (result.type).toBe ('ok');
		expect (result.value).toBe (true);
		const providerData = providers.get ('provider1');
		expect (providerData.resources).toBe (1500);
		expect (providerData.pricePerUnit).toBe (15);
	});
	
	it ('should allow consumers to add funds', () => {
		const result = addFunds ('consumer1', 1000);
		expect (result.type).toBe ('ok');
		expect (result.value).toBe (true);
		const consumerData = consumers.get ('consumer1');
		expect (consumerData.balance).toBe (1000);
	});
	
	it ('should allow consumers to request compute resources', () => {
		registerProvider ('provider1', 1000, 10);
		addFunds ('consumer1', 1000);
		const result = requestCompute ('consumer1', 'provider1', 50);
		expect (result.type).toBe ('ok');
		expect (result.value).toBe (1);
		const job = activeJobs.get (1);
		expect (job).toBeDefined ();
		expect (job.consumer).toBe ('consumer1');
		expect (job.provider).toBe ('provider1');
		expect (job.resources).toBe (50);
		expect (job.totalCost).toBe (500);
	});
	
	it ('should allow providers to complete jobs', () => {
		registerProvider ('provider1', 1000, 10);
		addFunds ('consumer1', 1000);
		requestCompute ('consumer1', 'provider1', 50);
		const result = completeJob ('provider1', 1);
		expect (result.type).toBe ('ok');
		expect (result.value).toBe (true);
		const job = activeJobs.get (1);
		expect (job.status).toBe ('completed');
		const providerData = providers.get ('provider1');
		expect (providerData.resources).toBe (1000);
		expect (providerData.earnings).toBe (500);
	});
	
	it ('should allow providers to withdraw earnings', () => {
		registerProvider ('provider1', 1000, 10);
		addFunds ('consumer1', 1000);
		requestCompute ('consumer1', 'provider1', 50);
		completeJob ('provider1', 1);
		const result = withdrawEarnings ('provider1');
		expect (result.type).toBe ('ok');
		expect (result.value).toBe (500);
		const providerData = providers.get ('provider1');
		expect (providerData.earnings).toBe (0);
	});
	
});
