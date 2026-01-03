import Agenda from 'agenda';
import userModel from "../models/user.model.js";

let agendaInstance = null;

// Initialize agenda instance with database connection
export async function initializeB2BScheduler(mongoUri = process.env.MONGODB_URI) {
    if (agendaInstance) {
        console.log('B2B Scheduler already initialized');
        return agendaInstance;
    }

    if (!mongoUri) {
        throw new Error('MongoDB URI is required for Agenda initialization');
    }

    try {
        // Create Agenda instance
        agendaInstance = new Agenda({
            db: { address: mongoUri },
            processEvery: '1 minute', // Check for jobs every minute
        });

        // Define the job for expiring B2B verification
        agendaInstance.define('expire b2b verification', async (job) => {
            const { userId, tiersPurchased } = job.attrs.data;
            
            console.log(`Processing B2B expiration for seller ${userId}`);
            
            try {
                const user = await userModel.findById(userId);
                
                if (!user) {
                    console.warn(`User ${userId} not found during B2B expiration`);
                    return;
                }
                
                if (user.b2bVerified) {
                    // Expire the B2B verification
                    user.b2bVerified = false;
                    user.subscriptionLevel = null; // or set to default level
                    await user.save();
                    
                    console.log(`Successfully expired B2B verification for seller ${userId}. Tiers were: ${tiersPurchased?.join(', ')}`);
                    
                    // Optional: Send notification email/push notification to user
                    // await sendExpirationNotification(user);
                    
                } else {
                    console.log(`B2B verification for seller ${userId} was already expired`);
                }
                
            } catch (error) {
                console.error(`Failed to expire B2B verification for seller ${userId}:`, error);
                throw error; // This will mark the job as failed in Agenda
            }
        });

        // Start Agenda
        await agendaInstance.start();
        console.log('B2B Scheduler initialized and started with Agenda');

        // Graceful shutdown handler
        const gracefulShutdown = async () => {
            console.log('Shutting down B2B Scheduler...');
            await agendaInstance.stop();
            console.log('B2B Scheduler stopped');
        };

        // Register shutdown handlers
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        return agendaInstance;

    } catch (error) {
        console.error('Failed to initialize B2B Scheduler:', error);
        throw error;
    }
}

// Get the current agenda instance (for testing/debugging)
export function getAgendaInstance() {
    return agendaInstance;
}

// Schedule or update B2B verification expiration
export async function scheduleB2BVerification({ userId, paymentSuccess, tier }) {
    if (!paymentSuccess) {
        console.log('Payment not successful, skipping B2B scheduling');
        return;
    }
    
    if (!agendaInstance) {
        throw new Error('Agenda instance not initialized. Call initializeB2BScheduler first.');
    }

    // Map tier to duration in milliseconds
    const tierDurations = {
        tier1: 3 * 30 * 24 * 60 * 60 * 1000, // 3 months
        tier2: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
        tier3: 12 * 30 * 24 * 60 * 60 * 1000, // 12 months
    };

    const duration = tierDurations[tier];
    if (!duration) {
        throw new Error(`Invalid tier: ${tier}`);
    }

    try {
        // Look for existing job for this user
        const jobs = await agendaInstance.jobs({ 
            'data.userId': userId, 
            name: 'expire b2b verification' 
        });

        let expireDate;
        let tiersPurchased = [tier];

        if (jobs.length > 0) {
            // Update existing job
            const job = jobs[0];
            
            // Calculate new expiration: current expiration + new duration, or now + duration if already expired
            const now = new Date();
            const currentExpire = job.attrs.nextRunAt && job.attrs.nextRunAt > now 
                ? job.attrs.nextRunAt 
                : now;
            
            expireDate = new Date(currentExpire.getTime() + duration);

            // Track all tiers purchased
            tiersPurchased = Array.isArray(job.attrs.data.tiersPurchased)
                ? [...job.attrs.data.tiersPurchased, tier]
                : [tier];

            job.attrs.data.tiersPurchased = tiersPurchased;
            await job.schedule(expireDate).save();
            
            console.log(`Updated B2B expiration for user ${userId} to ${expireDate.toISOString()} with tiers: ${tiersPurchased.join(', ')}`);
        } else {
            // Create new job
            expireDate = new Date(Date.now() + duration);
            await agendaInstance.schedule(expireDate, 'expire b2b verification', { 
                userId, 
                tiersPurchased 
            });
            
            console.log(`Scheduled new B2B expiration for user ${userId} at ${expireDate.toISOString()} with tier: ${tier}`);
        }

        return { expireDate, tiersPurchased };
        
    } catch (error) {
        console.error('Error scheduling B2B verification:', error);
        throw error;
    }
}