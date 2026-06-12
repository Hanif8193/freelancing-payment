import uuid

import httpx

from config import settings


class BlockchainService:
    CIRCLE_BASE = "https://api.circle.com/v1/w3s"

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {settings.CIRCLE_API_KEY}",
            "Content-Type": "application/json",
        }

    async def create_wallet(self) -> str:
        """Create a new Circle wallet and return its address."""
        if settings.CIRCLE_SIMULATE:
            return f"0xSIM{uuid.uuid4().hex[:16].upper()}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.CIRCLE_BASE}/wallets",
                headers=self._headers(),
                json={
                    "idempotencyKey": str(uuid.uuid4()),
                    "blockchains": ["ARC"],
                    "walletSetId": settings.CIRCLE_WALLET_SET_ID,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["data"]["wallets"][0]["address"]

    async def transfer_usdc(
        self,
        sender_wallet: str,
        receiver_wallet: str,
        amount: float,
        invoice_id: uuid.UUID,
    ) -> dict:
        """
        Transfer USDC from sender to receiver.
        Returns {transfer_id, tx_hash, status}.
        """
        if settings.CIRCLE_SIMULATE:
            sim_id = str(uuid.uuid4())
            return {
                "transfer_id": f"SIM-{sim_id[:8]}",
                "tx_hash": f"0xSIM{uuid.uuid4().hex[:40].upper()}",
                "status": "CONFIRMED",
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.CIRCLE_BASE}/transactions/transfer",
                headers=self._headers(),
                json={
                    "idempotencyKey": str(uuid.uuid4()),
                    "sourceWalletId": sender_wallet,
                    "destinationAddress": receiver_wallet,
                    "amounts": [str(round(amount, 6))],
                    "feeLevel": "MEDIUM",
                    "tokenId": "USDC",
                    "blockchain": "ARC",
                    "refId": str(invoice_id),
                },
            )
            resp.raise_for_status()
            data = resp.json()
            transfer = data["data"]["transfer"]
            return {
                "transfer_id": transfer["id"],
                "tx_hash": transfer.get("txHash", ""),
                "status": transfer.get("state", "PENDING").upper(),
            }

    async def get_transfer_status(self, transfer_id: str) -> str:
        if settings.CIRCLE_SIMULATE:
            return "CONFIRMED"

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{self.CIRCLE_BASE}/transactions/{transfer_id}",
                headers=self._headers(),
            )
            resp.raise_for_status()
            return resp.json()["data"]["transaction"]["state"].upper()


blockchain_service = BlockchainService()
