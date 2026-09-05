export interface IQuery {
	searchTerm?: string;
	page?: number;
	limit?: string;
	sortBy?: string;
	sortOrder?: string;

	// any other filter fields
	[key: string]: any;
}
