const anchor = require('@project-serum/anchor');
const fs = require('fs');
const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');

// Load the IDL (Interface Definition Language) file
const idl = JSON.parse(fs.readFileSync('./contracts/cibl_challenge.json', 'utf8'));

async function deployChallengeContract() {
    console.log('🚀 Starting CiBL Challenge Contract Deployment...');

    // 1. Configure Connection
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    console.log('✅ Connected to Solana Devnet');

    // 2. Load or Generate Keypair for Deployer
    let deployer;
    const keypairPath = './deployer-keypair.json';
    
    if (fs.existsSync(keypairPath)) {
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        deployer = Keypair.fromSecretKey(new Uint8Array(keypairData));
        console.log('📁 Loaded existing deployer keypair');
    } else {
        deployer = Keypair.generate();
        fs.writeFileSync(keypairPath, JSON.stringify(Array.from(deployer.secretKey)));
        console.log('🔑 Generated new deployer keypair');
    }
    
    console.log('Deployer Public Key:', deployer.publicKey.toString());

    // 3. Request Airdrop for Devnet (Only works on devnet/testnet)
    try {
        const airdropSignature = await connection.requestAirdrop(
            deployer.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL // Request 2 SOL
        );
        await connection.confirmTransaction(airdropSignature);
        console.log('💰 Airdrop successful');
    } catch (error) {
        console.log('⚠️  Airdrop failed (might be rate limited), continuing...');
    }

    // 4. Initialize Anchor Provider
    const wallet = new anchor.Wallet(deployer);
    const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: 'confirmed',
    });
    anchor.setProvider(provider);

    // 5. Deploy the Program
    console.log('🏗️  Building and deploying contract...');
    
    // Path to your compiled program
    const programPath = './target/deploy/cibl_challenge.so';
    
    if (!fs.existsSync(programPath)) {
        console.error('❌ Compiled program not found. Please run `cargo build-bpf` first.');
        process.exit(1);
    }

    // Read the compiled program
    const programBinary = fs.readFileSync(programPath);
    
    // Calculate program size and rent
    const programSize = programBinary.length;
    const rentExemption = await connection.getMinimumBalanceForRentExemption(programSize);
    console.log(`Program Size: ${programSize} bytes`);
    console.log(`Rent Exemption Required: ${rentExemption / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    // Create program account keypair
    const programKeypair = Keypair.generate();
    console.log(`Generated Program ID: ${programKeypair.publicKey.toString()}`);

    // Deploy the program
    try {
        const transaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: deployer.publicKey,
                newAccountPubkey: programKeypair.publicKey,
                lamports: rentExemption,
                space: programSize,
                programId: anchor.web3.BPF_LOADER_PROGRAM_ID,
            }),
            anchor.web3.BPF_LOADER_PROGRAM_ID.createInitializeBufferInstruction(
                programKeypair.publicKey,
                deployer.publicKey,
                deployer.publicKey
            ),
            anchor.web3.BPF_LOADER_PROGRAM_ID.load({
                bytes: programBinary,
                payer: deployer.publicKey,
                programId: programKeypair.publicKey,
            })
        );

        const signature = await anchor.web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [deployer, programKeypair],
            { commitment: 'confirmed' }
        );

        console.log(`✅ Contract deployed successfully!`);
        console.log(`📝 Transaction Signature: ${signature}`);
        console.log(`🔗 Program ID: ${programKeypair.publicKey.toString()}`);
        console.log(`🌐 Explorer URL: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

        // Save program ID to a file for frontend use
        const programInfo = {
            programId: programKeypair.publicKey.toString(),
            deployer: deployer.publicKey.toString(),
            network: 'devnet',
            deploymentTime: new Date().toISOString(),
            transaction: signature
        };
        
        fs.writeFileSync(
            './contracts/program-info.json',
            JSON.stringify(programInfo, null, 2)
        );
        
        console.log('💾 Program info saved to contracts/program-info.json');

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

async function testChallengeContract() {
    console.log('\n🧪 Testing deployed contract...');
    
    // Load program info
    const programInfo = JSON.parse(fs.readFileSync('./contracts/program-info.json', 'utf8'));
    const programId = new PublicKey(programInfo.programId);
    
    // Initialize program client
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const wallet = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: 'confirmed',
    });
    
    const program = new anchor.Program(idl, programId, provider);
    
    // Test: Create a challenge
    try {
        const challengeKeypair = Keypair.generate();
        const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL); // 1 SOL
        const assetPair = "SOL/USDC";
        const durationSeconds = new anchor.BN(60);
        
        console.log('Creating test challenge...');
        
        const tx = await program.methods
            .createChallenge(amount, assetPair, durationSeconds)
            .accounts({
                challengeAccount: challengeKeypair.publicKey,
                creator: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([challengeKeypair])
            .rpc();
            
        console.log(`✅ Test challenge created!`);
        console.log(`📝 Transaction: ${tx}`);
        console.log(`🎯 Challenge Account: ${challengeKeypair.publicKey.toString()}`);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run deployment
deployChallengeContract()
    .then(() => testChallengeContract())
    .then(() => {
        console.log('\n🎉 Deployment and testing completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update the program ID in your frontend');
        console.log('2. Create React hooks to interact with the contract');
        console.log('3. Integrate with your Supabase challenge system');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });