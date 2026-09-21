FINAPP → IIPS BROKER IMPORT REUSE HANDOFF

Source:
G:\finboom_AG\finapp-authoritative

Source repository:
ramkivs/finapp

Purpose:
Governed compatibility/reuse assessment for IIPS.

Included:
- BrokerAdapter
- BrokerFormatDetector
- ZerodhaHoldingsAdapter
- DhanHoldingsAdapter
- GrowwHoldingsAdapter
- BrokerImportService
- Relevant adapter/service tests

Status:
SOURCE DEPOSITION ONLY — REUSE NOT YET APPROVED

Scope:
Offline/file-based broker holdings import and normalization.

Explicitly excluded:
- Live broker API activation
- Broker credentials/tokens
- Production provider activation
- Trading/order functionality

Next action:
IIPS/Arena shall perform BI-02 compatibility assessment against
the existing IIPS Portfolio/UserHoldingInput contracts.

No Finapp source was modified by this deposition.
