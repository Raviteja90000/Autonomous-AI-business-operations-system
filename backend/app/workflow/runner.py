import asyncio
from backend.app.core.database import async_session_factory
from backend.app.workflow.state_machine import ODAEAFlowEngine
from backend.app.core.logging import logger


async def run_cycle_background(cycle_id: str, autonomy_tier: int = 2):
    """Executes ODAEA cycle in an independent async worker context."""
    async with async_session_factory() as session:
        try:
            engine = ODAEAFlowEngine(session)
            await engine.execute_cycle_step(cycle_id, autonomy_tier)
        except Exception as e:
            logger.error(f"Background cycle execution {cycle_id} error: {str(e)}", exc_info=True)


def schedule_cycle_async(cycle_id: str, autonomy_tier: int = 2):
    asyncio.create_task(run_cycle_background(cycle_id, autonomy_tier))
