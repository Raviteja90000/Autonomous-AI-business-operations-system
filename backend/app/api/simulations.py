from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.simulation_service import ScenarioSimulationService
from backend.app.auth.dependencies import get_current_user_optional
from backend.app.models.auth import User

router = APIRouter(prefix="/simulations", tags=["Scenario Simulator"])


class ScenarioInfo(BaseModel):
    id: str
    title: str
    domain: str
    severity: str
    arr_impact_usd: float
    description: str
    crisis_trigger: str
    target_systems: List[str]
    recommended_autonomy: int
    icon: str
    expected_remediation: str


class SimulationRunRequest(BaseModel):
    autonomy_tier: int = 2
    send_live_actions: bool = True


@router.get("/scenarios", response_model=List[ScenarioInfo])
async def list_simulation_scenarios():
    """Returns the catalog of 4 pre-built enterprise crisis scenarios for God Mode simulation."""
    return ScenarioSimulationService.list_scenarios()


@router.post("/run/{scenario_id}")
async def run_simulation_scenario(
    scenario_id: str,
    req: SimulationRunRequest = SimulationRunRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Executes a real-world enterprise crisis scenario through the full ODAEA engine."""
    try:
        res = await ScenarioSimulationService.run_scenario(
            db=db,
            scenario_id=scenario_id,
            autonomy_tier=req.autonomy_tier,
            send_live_actions=req.send_live_actions,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Simulation error: {str(e)}")
