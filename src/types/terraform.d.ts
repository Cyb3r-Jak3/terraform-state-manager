// LockInfo
// https://github.com/hashicorp/terraform/blob/9294c4bff83103cff510be4c32b046d1517e4b4d/internal/states/statemgr/locker.go#L118
export interface LockInfo {
	ID: string;
	Operation: string;
	Info: string;
	Who: string;
	Version: string;
	Created: string;
	Path: string;
}
