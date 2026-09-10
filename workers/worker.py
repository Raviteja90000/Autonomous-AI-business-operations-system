import asyncio
import signal
import sys
from datetime import datetime, timezone
from backend.app.core.database import async_session_factory, init_database
from backend.app.services.cycle_service import CycleService
from backend.app.services.seed_service import SeedService
from backend.app.core.logging import logger

IS_RUNNING = True


def handle_shutdown(sig, frame):
    global IS_RUNNING
    logger.info("Worker received shutdown signal. Exiting gracefully...")
    IS_RUNNING = False


async def worker_loop():
    global IS_RUNNING
    logger.info("Background Operations Worker started. Listening for scheduled cycle triggers...")
    
    await init_database()
    async with async_session_factory() as session:
        await SeedService.seed_all(session)

    cycle_domains = ["sales", "finance", "support", "marketing", "operations"]
    domain_idx = 0

    while IS_RUNNING:
        try:
            domain = cycle_domains[domain_idx % len(cycle_domains)]
            domain_idx += 1
            
            logger.info(f"Worker heartbeat: running periodic domain anomaly check for '{domain}'...")
            async with async_session_factory() as session:
                # Run an automated background cycle in Tier 2
                await CycleService.trigger_cycle(
                    db=session,
                    domain=domain,
                    trigger_type="SCHEDULED",
                    autonomy_tier=2
                )
            
            # Sleep 60 seconds between scheduled automated cycles
            for _ in range(60):
                if not IS_RUNNING:
                    break
                await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"Worker loop encountered error: {str(e)}", exc_info=True)
            await asyncio.sleep(5)


if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    asyncio.run(worker_loop())
