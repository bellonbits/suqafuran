from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class SalesReportBase(SQLModel):
    seller_id: int = Field(foreign_key="user.id", index=True)
    report_type: str  # sales, inventory, earnings, etc.
    status: str = Field(default="pending")  # pending, completed, failed


class SalesReport(SalesReportBase, table=True, tablename="sales_report"):
    id: Optional[int] = Field(default=None, primary_key=True)
    last_generated: Optional[datetime] = None
    report_size: int = Field(default=0)  # Size in bytes
    file_path: Optional[str] = None  # Path to generated report file
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SalesReportCreate(SQLModel):
    report_type: str


class SalesReportRead(SalesReport):
    pass


class ReportStatsRead(SQLModel):
    total_reports: int
    last_generated: Optional[datetime]
    report_size: int
