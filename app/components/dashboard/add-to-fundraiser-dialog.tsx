import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import api from "@/app/_services/api_service";
import { CheckCircle2, Link2, Loader2, Search } from "lucide-react";

interface Fundraiser {
  _id: string;
  title?: string;
  status?: string;
}

interface AddToFundraiserDialogProps {
  donationId: string;
  onSuccess?: (fundraiserTitle: string) => void;
  triggerLabel?: string;
  triggerClassName?: string;
}

export const AddToFundraiserDialog: React.FC<AddToFundraiserDialogProps> = ({
  donationId,
  onSuccess,
  triggerLabel = "Add to Fundraiser",
  triggerClassName = "",
}) => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      setFetching(true);
      const params = new URLSearchParams();
      params.append("status", "active");
      params.append("limit", "100");
      api
        .get(`/v1/fundraisers/public?${params.toString()}`)
        .then((res) => {
          const items = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.fundraisers)
              ? res.data.fundraisers
              : [];

          setFundraisers(items);
        })
        .catch(() => setFundraisers([]))
        .finally(() => setFetching(false));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundraiser) return;
    setError("");
    setConfirmOpen(true);
  };

  const handleConfirmLink = async () => {
    if (!donationId || !selectedFundraiser) {
      setError("Please select a fundraiser before linking.");
      setConfirmOpen(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.put(
        `/v1/donations/${donationId}/link-campaign`,
        {
          campaign_id: campaignId,
        },
      );

      if (response.data?.error) {
        throw new Error(response.data?.message || "Failed to link fundraiser");
      }

      setConfirmOpen(false);
      setOpen(false);
      setCampaignId("");
      if (onSuccess)
        onSuccess(selectedFundraiser.title || "Untitled fundraiser");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to link fundraiser",
      );
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setCampaignId("");
      setError("");
      setSearch("");
      setConfirmOpen(false);
    }
  };

  const selectedFundraiser = fundraisers.find((f) => f._id === campaignId);

  const filteredFundraisers = fundraisers.filter((fundraiser) =>
    (fundraiser.title || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 ${triggerClassName}`}
          >
            <Link2 className="h-3.5 w-3.5" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-1.5rem)] max-w-sm gap-0 overflow-hidden p-0 sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b bg-slate-50 px-4 py-3">
              <DialogTitle className="flex min-w-0 items-center gap-2 text-base">
                <Link2 className="h-4 w-4 shrink-0 text-primary" />
                Link to Fundraiser
              </DialogTitle>
              <DialogDescription className="text-xs">
                Choose an active fundraiser for this donation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 px-4 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder="Search fundraiser by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <ScrollArea className="h-48 rounded-md border bg-white sm:h-56">
                {fetching ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:h-56">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading fundraisers...
                  </div>
                ) : filteredFundraisers.length > 0 ? (
                  <div className="divide-y">
                    {filteredFundraisers.map((fundraiser) => {
                      const isSelected = campaignId === fundraiser._id;

                      return (
                        <button
                          key={fundraiser._id}
                          type="button"
                          className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors ${
                            isSelected ? "bg-primary/10" : "hover:bg-slate-50"
                          }`}
                          onClick={() => setCampaignId(fundraiser._id)}
                        >
                          <span
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 overflow-hidden">
                            <span className="line-clamp-2 block break-words text-sm font-medium leading-5 text-slate-900">
                              {fundraiser.title || "Untitled fundraiser"}
                            </span>
                            <span className="mt-1 block leading-none">
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] capitalize"
                              >
                                {fundraiser.status || "active"}
                              </Badge>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center px-6 text-center sm:h-56">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      No fundraisers found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try a different search term.
                    </p>
                  </div>
                )}
              </ScrollArea>

              {selectedFundraiser && (
                <div className="min-w-0 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Selected: </span>
                  <span className="break-words font-medium text-slate-900">
                    {selectedFundraiser.title || "Untitled fundraiser"}
                  </span>
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="flex-row justify-end gap-2 space-x-0 border-t bg-slate-50 px-4 py-3 sm:space-x-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="min-w-20"
                disabled={loading || !campaignId}
              >
                Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => !loading && setConfirmOpen(nextOpen)}
      >
        <DialogContent className="z-[1600] w-[calc(100vw-1.5rem)] max-w-sm gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b bg-slate-50 px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Confirm Link
            </DialogTitle>
            <DialogDescription className="text-xs">
              This donation will be assigned to the selected fundraiser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-4 py-3 text-sm">
            <div className="rounded-md border bg-white p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fundraiser
              </p>
              <p className="break-words font-medium text-slate-900">
                {selectedFundraiser?.title || "Untitled fundraiser"}
              </p>
              <Badge
                variant="secondary"
                className="mt-2 px-1.5 py-0 text-[10px] capitalize"
              >
                {selectedFundraiser?.status || "active"}
              </Badge>
            </div>

            <div className="rounded-md border bg-white p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Donation ID
              </p>
              <p className="break-all font-mono text-xs text-slate-800">
                {donationId}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 space-x-0 border-t bg-slate-50 px-4 py-3 sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-w-20"
              disabled={loading}
              onClick={handleConfirmLink}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Linking..." : "Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
