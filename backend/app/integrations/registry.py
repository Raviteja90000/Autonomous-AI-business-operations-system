from typing import Dict, Optional, List
from backend.app.core.config import settings
from backend.app.integrations.base import BaseIntegration
from backend.app.integrations.crm import CRMIntegration
from backend.app.integrations.finance import FinanceIntegration
from backend.app.integrations.support import SupportIntegration
from backend.app.integrations.email import EmailIntegration
from backend.app.integrations.marketing import MarketingIntegration


class IntegrationRegistry:
    def __init__(self):
        email_is_mock = not (bool(settings.RESEND_API_KEY or settings.SENDGRID_API_KEY) and settings.EMAIL_CONNECTOR_TYPE != "mock")
        finance_is_mock = not (bool(settings.STRIPE_API_KEY) and settings.FINANCE_CONNECTOR_TYPE != "mock")
        crm_is_mock = not (bool(settings.HUBSPOT_ACCESS_TOKEN) and settings.CRM_CONNECTOR_TYPE != "mock")
        support_is_mock = not (bool(settings.GITHUB_TOKEN or settings.ZENDESK_API_TOKEN) and settings.SUPPORT_CONNECTOR_TYPE != "mock")

        self._integrations: Dict[str, BaseIntegration] = {
            "crm": CRMIntegration(is_mock=crm_is_mock),
            "finance": FinanceIntegration(is_mock=finance_is_mock),
            "support": SupportIntegration(is_mock=support_is_mock),
            "email": EmailIntegration(is_mock=email_is_mock),
            "marketing": MarketingIntegration(is_mock=True),
        }

    def get(self, name: str) -> Optional[BaseIntegration]:
        return self._integrations.get(name.lower())

    def get_by_domain(self, domain: str) -> List[BaseIntegration]:
        domain_lower = domain.lower()
        return [i for i in self._integrations.values() if i.domain == domain_lower or domain_lower == "all"]

    def list_all(self) -> List[BaseIntegration]:
        return list(self._integrations.values())


integration_registry = IntegrationRegistry()

