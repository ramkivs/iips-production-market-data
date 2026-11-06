# DHAN-P7 Source Reconciliation Report

- Detailed vs compact join key: EXCH_ID/SEM_EXM_EXCH_ID + SEGMENT/SEM_SEGMENT + SECURITY_ID/SEM_SMST_SECURITY_ID (provider scope; IDs are not globally unique).
- Equity-candidate reconciliation: {"consistent":23764,"missingInCompact":0,"seriesMismatch":0,"notEquitySkipped":193340}
- Category counts: {"C|FUTCUR":290,"C|OPTCUR":23872,"D|OPTSTK":108589,"D|OPTIDX":19643,"D|FUTSTK":1310,"D|FUTIDX":30,"E|EQUITY":23764,"M|FUTCOM":170,"M|OPTFUT":38582,"M|FUTIDX":6,"M|OPTIDX":654,"G|EQUITY":4,"I|INDEX":190}
- Compact master carries no ISIN; ISIN exists only in the detailed master.
