The policy fills the order from one location when any eligible location can ship every line, because a split doubles shipping cost and parcels. Warehouse A can, so the allocation is both lines from A, even though B is closer.

Only when no single location can fill the order do we split, using the fewest locations and preferring ones already used. Store the allocation on each order line and reserve at A in the same transaction.
