"use client";

import * as React from "react";
import { useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  X,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";

// Enhanced type definitions
export interface FilterConfig {
  type: "text" | "select" | "date" | "number" | "boolean";
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue?: (row: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterFunction?: (row: any, filterValue: any) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (value: any) => void;
}

export interface ColumnDef<T> {
  accessorKey: keyof T | string;
  header: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterConfig?: FilterConfig;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: React.ReactElement | ((row: T) => React.ReactElement);
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  maxHeight?: string;
  members?: { id: string; firstname: string; lastname: string }[];
  onRowClick?: (row: T) => void; // 🔥 Optional row click handler
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface FilterState {
  [key: string]: unknown;
}
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  isLoading = false,
  emptyMessage = "No data available",
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  searchable = true,
  searchPlaceholder = "Search...",
  className,
  maxHeight,
  members = [],
  onRowClick, // 🔥 Add row click handler
}: DataTableProps<T>) {
  const [sortState, setSortState] = React.useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Initialize column filters with default values 🔥
  const [columnFilters, setColumnFilters] = React.useState<FilterState>(() => {
    const initialFilters: FilterState = {};
    columns.forEach((column) => {
      if (column.filterConfig?.defaultValue) {
        initialFilters[String(column.accessorKey)] =
          column.filterConfig.defaultValue;
      }
    });
    return initialFilters;
  });

  // Update filters when columns change (for URL parameter sync)
  React.useEffect(() => {
    const newFilters: FilterState = {};
    let hasChanges = false;

    columns.forEach((column) => {
      const columnKey = String(column.accessorKey);
      const defaultValue = column.filterConfig?.defaultValue;

      if (defaultValue !== undefined) {
        // Always sync with defaultValue to ensure URL parameter changes are reflected
        if (columnFilters[columnKey] !== defaultValue) {
          newFilters[columnKey] = defaultValue;
          hasChanges = true;
        }
      }
    });

    // Only update if there are actual changes
    if (hasChanges) {
      setColumnFilters((prev) => ({ ...prev, ...newFilters }));
    }
  }, [columns.map((col) => col.filterConfig?.defaultValue).join(",")]); // Watch for defaultValue changes

  // Filter data based on global search and column filters
  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Apply global filter
    if (globalFilter) {
      filtered = filtered.filter((row) =>
        columns.some((column) => {
          const value = row[column.accessorKey];
          return String(value || "")
            .toLowerCase()
            .includes(globalFilter.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
      if (
        filterValue !== undefined &&
        filterValue !== "" &&
        filterValue !== null &&
        filterValue !== "all"
      ) {
        const column = columns.find(
          (col) => String(col.accessorKey) === columnKey
        );
        if (!column?.filterConfig) return;

        // Use custom filterFunction if provided
        if (typeof column.filterConfig.filterFunction === "function") {
          filtered = filtered.filter((row) =>
            column.filterConfig!.filterFunction!(row, filterValue)
          );
          return;
        }

        // Default filtering logic
        // const cellValue = column.filterConfig?.getValue
        //   ? column.filterConfig.getValue(row)
        //   : row[column.accessorKey];

        switch (column.filterConfig!.type) {
          case "text":
            filtered = filtered.filter((row) => {
              const value = column.filterConfig?.getValue
                ? column.filterConfig.getValue(row)
                : row[column.accessorKey];
              return String(value || "")
                .toLowerCase()
                .includes(String(filterValue).toLowerCase());
            });
            break;
          case "select":
            filtered = filtered.filter((row) => {
              const value = column.filterConfig?.getValue
                ? column.filterConfig.getValue(row)
                : row[column.accessorKey];
              return value === filterValue;
            });
            break;
          case "number":
            filtered = filtered.filter((row) => {
              const value = column.filterConfig?.getValue
                ? column.filterConfig.getValue(row)
                : row[column.accessorKey];
              return Number(value) === Number(filterValue);
            });
            break;
          case "boolean":
            filtered = filtered.filter((row) => {
              const value = column.filterConfig?.getValue
                ? column.filterConfig.getValue(row)
                : row[column.accessorKey];
              return String(value) === String(filterValue);
            });
            break;
          case "date":
            filtered = filtered.filter((row) => {
              const value = column.filterConfig?.getValue
                ? column.filterConfig.getValue(row)
                : row[column.accessorKey];
              if (
                filterValue &&
                typeof filterValue === "object" &&
                filterValue !== null
              ) {
                const dateFilter = filterValue as { from?: Date; to?: Date };
                if (dateFilter.from || dateFilter.to) {
                  const cellDate = new Date(value as string);
                  const fromDate = dateFilter.from
                    ? new Date(dateFilter.from)
                    : null;
                  const toDate = dateFilter.to ? new Date(dateFilter.to) : null;

                  if (fromDate && toDate) {
                    return cellDate >= fromDate && cellDate <= toDate;
                  } else if (fromDate) {
                    return cellDate >= fromDate;
                  } else if (toDate) {
                    return cellDate <= toDate;
                  }
                }
              }
              return true;
            });
            break;
          default:
            break;
        }
      }
    });

    return filtered;
  }, [data, globalFilter, columnFilters, columns]);

  // Sort filtered data
  const sortedData = React.useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.column!];
      const bValue = b[sortState.column!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortState.direction === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortState.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // For dates and other types
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortState]);

  // Paginate sorted data
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startRow =
    sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, sortedData.length);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.accessorKey === columnKey);
    if (!column?.sortable) return;

    setSortState((prev) => {
      if (prev.column === columnKey) {
        if (prev.direction === "asc") {
          return { column: columnKey, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { column: null, direction: null };
        }
      }
      return { column: columnKey, direction: "asc" };
    });
  };

  // Handle column filter change
  const handleColumnFilterChange = (columnKey: string, value: unknown) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering

    // Call onChange callback if provided 🔥
    const column = columns.find((col) => String(col.accessorKey) === columnKey);
    if (column?.filterConfig?.onChange) {
      column.filterConfig.onChange(value);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setGlobalFilter("");

    // Reset to default values instead of clearing completely 🔥
    const defaultFilters: FilterState = {};
    columns.forEach((column) => {
      if (column.filterConfig?.defaultValue) {
        defaultFilters[String(column.accessorKey)] =
          column.filterConfig.defaultValue;

        // Call onChange callback if provided 🔥
        if (column.filterConfig?.onChange) {
          column.filterConfig.onChange(column.filterConfig.defaultValue);
        }
      }
    });
    setColumnFilters(defaultFilters);
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortState.column !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortState.direction === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    if (sortState.direction === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  // Check if any filters are active
  const hasActiveFilters =
    globalFilter ||
    Object.values(columnFilters).some(
      (value) =>
        value !== undefined &&
        value !== "" &&
        value !== null &&
        value !== "all" &&
        (typeof value === "object" ? Object.values(value).some((v) => v) : true)
    );

  // Column filter component
  const ColumnFilter = ({ column }: { column: ColumnDef<T> }) => {
    const columnKey = String(column.accessorKey);
    const rawFilterValue = columnFilters[columnKey];
    const filterValue = String(
      rawFilterValue || column.filterConfig?.defaultValue || ""
    );
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        handleColumnFilterChange(columnKey, value);
      }, 300); // 300ms debounce
    };

    switch (column.filterConfig!.type) {
      case "text":
        return (
          <Input
            placeholder={
              column.filterConfig?.placeholder || `Filter ${column.header}...`
            }
            defaultValue={filterValue}
            onChange={handleChange}
            className="h-8 w-[150px]"
          />
        );

      case "select":
        return (
          <Select
            value={filterValue || "all"} // Default to "all" if empty
            onValueChange={(value) =>
              handleColumnFilterChange(columnKey, value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder={`Filter ${column.header}`} />
            </SelectTrigger>
            <SelectContent>
              {column.filterConfig?.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-[150px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterValue &&
                typeof filterValue === "object" &&
                (filterValue as { from?: Date }).from ? (
                  (filterValue as { to?: Date }).to ? (
                    <>
                      {format((filterValue as { from: Date }).from, "LLL dd")} -{" "}
                      {format((filterValue as { to: Date }).to, "LLL dd")}
                    </>
                  ) : (
                    format((filterValue as { from: Date }).from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={
                  filterValue && typeof filterValue === "object"
                    ? (filterValue as { from?: Date }).from
                    : undefined
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                selected={filterValue as any}
                onSelect={(range) => handleColumnFilterChange(columnKey, range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={columnKey}
              checked={!!!filterValue}
              onCheckedChange={(checked) =>
                handleColumnFilterChange(columnKey, checked ? true : "")
              }
            />
            <label htmlFor={columnKey} className="text-sm">
              {column.header}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <>
      {Array.from({ length: pageSize }).map((_, index) => (
        <TableRow key={index}>
          {columns.map((column, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
          {actions && (
            <TableCell>
              <Skeleton className="h-8 w-20" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );

  // Empty state
  const EmptyState = () => (
    <TableRow>
      <TableCell
        colSpan={columns.length + (actions ? 1 : 0)}
        className="h-24 text-center text-muted-foreground"
      >
        {emptyMessage}
      </TableCell>
    </TableRow>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2 sm:px-0">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="h-8 px-2 lg:px-3"
            >
              Clear filters
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Column Filters */}
      {columns.some((col) => col.filterable) && (
        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>
          {columns
            .filter((col) => col.filterable && col.filterConfig)
            .map((column) => (
              <div
                key={String(column.accessorKey)}
                className="flex items-center space-x-2"
              >
                <span className="text-sm text-muted-foreground">
                  {column.header}:
                </span>
                <ColumnFilter column={column} />
              </div>
            ))}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {globalFilter && (
            <Badge variant="secondary" className="gap-1">
              Search: {globalFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setGlobalFilter("")}
              />
            </Badge>
          )}
          {Object.entries(columnFilters).map(([key, value]) => {
            if (!value || value === "") return null;
            const column = columns.find(
              (col) => String(col.accessorKey) === key
            );
            if (!column) return null;

            let displayValue = String(value);
            if (
              column.filterConfig?.type === "date" &&
              typeof value === "object" &&
              value !== null
            ) {
              const dateFilter = value as { from?: Date; to?: Date };
              if (dateFilter.from && dateFilter.to) {
                displayValue = `${format(dateFilter.from, "MMM dd")} - ${format(
                  dateFilter.to,
                  "MMM dd"
                )}`;
              } else if (dateFilter.from) {
                displayValue = `From ${format(dateFilter.from, "MMM dd")}`;
              } else if (dateFilter.to) {
                displayValue = `To ${format(dateFilter.to, "MMM dd")}`;
              }
            }

            // Buddy chip: show firstname + lastname
            if (key === "buddy") {
              const buddy = members.find((m) => m.id === value);
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1"
                  onClick={() => handleColumnFilterChange(key, "")}
                >
                  Buddy:{" "}
                  {buddy
                    ? `${buddy.firstname} ${buddy.lastname}`
                    : String(value)}
                  <X className="h-3 w-3 cursor-pointer" />
                </Badge>
              );
            }

            // Status chip: show Active/Inactive
            if (key === "active") {
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1"
                  onClick={() => handleColumnFilterChange(key, "")}
                >
                  Status: {value === "true" ? "Active" : "Inactive"}
                  <X className="h-3 w-3 cursor-pointer" />
                </Badge>
              );
            }

            return (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1"
                onClick={() => handleColumnFilterChange(key, "")}
              >
                {column.header}: {displayValue}
                <X className="h-3 w-3 cursor-pointer" />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Responsive Table */}
      <div
        className="rounded-md border overflow-x-auto"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        <Table className="min-w-full w-full text-xs sm:text-sm">
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.accessorKey)}
                  className={
                    column.sortable ? "cursor-pointer select-none" : ""
                  }
                  style={{ width: column.width }}
                  onClick={() =>
                    column.sortable && handleSort(String(column.accessorKey))
                  }
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && getSortIcon(String(column.accessorKey))}
                  </div>
                </TableHead>
              ))}
              {actions && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : paginatedData.length === 0 ? (
              <EmptyState />
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={`block md:table-row border-b md:border-0 mb-4 md:mb-0 bg-background md:bg-transparent ${
                    onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.accessorKey)}
                      className="block md:table-cell px-2 py-2 md:px-4 md:py-2 align-top"
                      style={
                        column.width
                          ? { width: column.width, maxWidth: column.width }
                          : undefined
                      }
                    >
                      <span className="md:hidden font-semibold text-muted-foreground block mb-1">
                        {column.header}
                      </span>
                      {column.cell
                        ? column.cell(row[column.accessorKey], row)
                        : String(row[column.accessorKey] ?? "")}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell
                      className="block md:table-cell px-2 py-2 md:px-4 md:py-2 align-top"
                      onClick={(e) => e.stopPropagation()} // 🔥 Prevent row click on actions
                    >
                      <span className="md:hidden font-semibold text-muted-foreground block mb-1">
                        Actions
                      </span>
                      {typeof actions === "function" ? actions(row) : actions}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Summary */}
      {!isLoading && (
        <div className="text-xs sm:text-sm text-muted-foreground">
          {sortedData.length !== data.length && (
            <span>
              Showing {sortedData.length} of {data.length} entries (filtered) •{" "}
            </span>
          )}
          Displaying {startRow} to {endRow} of {sortedData.length} entries
        </div>
      )}

      {/* Pagination */}
      {!isLoading && sortedData.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center space-x-2 sm:space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-xs sm:text-sm font-medium">Rows per page</p>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <p className="text-xs sm:text-sm font-medium">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
