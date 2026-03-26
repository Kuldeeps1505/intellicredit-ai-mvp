import asyncio
import logging
from datetime import datetime

from app.database import create_tables
from app.services.db_helper import update_app_status
from app.services.redis_service import dequeue_pipeline_job, publish_event
from agents.dag import run_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("intellicredit-worker")


async def process_job(app_id: str):
    await publish_event(app_id, {
        "event_type": "agent_status",
        "agentId": "doc_parse",
        "status": "running",
        "elapsed": 0,
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Pipeline queued for execution",
    })
    try:
        await run_pipeline(app_id)
        await publish_event(app_id, {
            "event_type": "complete",
            "result": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Pipeline completed successfully",
        })
    except Exception as exc:
        logger.exception("Pipeline failed for %s", app_id)
        await update_app_status(app_id, "ERROR")
        await publish_event(app_id, {
            "event_type": "complete",
            "result": "error",
            "error": str(exc),
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"Pipeline failed: {exc}",
            "level": "critical",
        })


async def main():
    await create_tables()
    logger.info("Worker started")
    while True:
        app_id = await dequeue_pipeline_job(timeout=5)
        if not app_id:
            continue
        logger.info("Dequeued pipeline job for %s", app_id)
        await process_job(app_id)


if __name__ == "__main__":
    asyncio.run(main())
