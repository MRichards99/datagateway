import {
  Box,
  Chip,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SearchIcon from '@material-ui/icons/Search';
import { Pagination } from '@material-ui/lab';
import {
  clearData,
  Entity,
  nestedValue,
  pushPageFilter,
  pushPageNum,
  pushPageResults,
  Filter,
} from 'datagateway-common';
import { QueryParams, StateType } from 'datagateway-common/lib/state/app.types';
import React from 'react';
import { connect } from 'react-redux';
import { IndexRange } from 'react-virtualized';
import { Action, AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import EntityCard, { EntityImageDetails } from './card.component';

const useCardViewStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.paper,
      // margin: '10px',
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
    },
    selectedChips: {
      display: 'inline-flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      listStyle: 'none',
      padding: theme.spacing(1),
      // margin: '15px',
    },
    chip: {
      margin: theme.spacing(0.5),
    },
  })
);

interface CardViewDetails {
  dataKey: string;

  // TODO: Pass in a label for the dataKey to be shown under.
  //       Pass a Link component to wrap the data.
  label?: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  content?: (data?: any) => React.ReactNode;
}

interface CardViewProps {
  data: Entity[];
  totalDataCount: number;
  loadData: (offsetParams: IndexRange) => Promise<void>;
  loadCount: () => Promise<void>;

  // Props to get title, description of the card
  // represented by data.
  title: CardViewDetails;
  description?: CardViewDetails;
  information?: CardViewDetails[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moreInformation?: (data?: any) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buttons?: ((data?: any) => React.ReactNode)[];

  cardFilters?: { label: string; dataKey: string; filterItems: string[] }[];
  image?: EntityImageDetails;
}

interface CardViewStateProps {
  loading: boolean;
  query: QueryParams;
  filters: {
    [column: string]: Filter;
  };
}

interface CardViewDispatchProps {
  pushPage: (page: number) => Promise<void>;
  pushResults: (results: number) => Promise<void>;
  pushFilters: (filter: string, data: Filter | null) => Promise<void>;
  clearData: () => Action;
}

type CardViewCombinedProps = CardViewProps &
  CardViewStateProps &
  CardViewDispatchProps;

interface CVFilterInfo {
  [filterKey: string]: {
    label: string;
    items: {
      [data: string]: boolean;
    };
    selectedCount: number;
  };
}

interface CVSelectedFilter {
  filterKey: string;
  label: string;
  items: string[];
}

// TODO: CardView needs URL support:
//        - sort (?sort=); will it require sort?
//        - searching (?search=)
const CardView = (props: CardViewCombinedProps): React.ReactElement => {
  const classes = useCardViewStyles();

  // Props.
  const {
    data,
    totalDataCount,
    query,
    filters,
    cardFilters,
    loadData,
    loadCount,
    buttons,
    loading,
    pushPage,
    pushResults,
    pushFilters,
    clearData,
  } = props;

  // Get card information.
  const { title, description, information, moreInformation, image } = props;

  // Card data.
  const [viewData, setViewData] = React.useState<Entity[]>([]);
  const [loadedData, setLoadedData] = React.useState(false);

  // Pagination.
  // TODO: This page is not reset when component is changed.
  const [page, setPage] = React.useState(-1);
  const [dataCount, setDataCount] = React.useState(-1);
  const [numPages, setNumPages] = React.useState(-1);
  const [maxResults, setMaxResults] = React.useState(-1);
  const [pageChange, setPageChange] = React.useState(false);
  const [filterChange, setFilterChange] = React.useState(false);

  // Filters.
  const [filtersInfo, setFiltersInfo] = React.useState<CVFilterInfo>({});
  const [selectedFilters, setSelectedFilters] = React.useState<
    CVSelectedFilter[]
  >([]);

  // Set the filter information based on what was provided.
  React.useEffect(() => {
    const getSelectedFilter = (
      filterKey: string,
      filterValue: string
    ): boolean => {
      if (filterKey in filters) {
        const v = filters[filterKey];
        if (Array.isArray(v) && v.includes(filterValue)) {
          return true;
        }
      }
      return false;
    };

    // Get the updated info.
    const info = cardFilters
      ? Object.values(cardFilters).reduce((o, filter) => {
          const data: CVFilterInfo = {
            ...o,
            [filter.dataKey]: {
              label: filter.label,
              items: filter.filterItems.reduce(
                (o, item) => ({
                  ...o,
                  [item]: getSelectedFilter(filter.dataKey, item),
                }),
                {}
              ),
              selectedCount: -1,
            },
          };

          // Update the selected count for each filter.
          data[filter.dataKey].selectedCount = Object.values(
            data[filter.dataKey].items
          ).filter(v => v).length;
          return data;
        }, {})
      : [];
    // console.log('info: ', info);
    setFiltersInfo(info);
  }, [cardFilters, filters]);

  // TODO: Set the selected filters.
  React.useEffect(() => {
    if (Object.keys(filtersInfo).length > 0) {
      // Get selected items only and remove any arrays without items.
      const selected = Object.entries(filtersInfo)
        .map(
          ([filterKey, info]) => ({
            filterKey: filterKey,
            label: info.label,
            items: Object.entries(info.items)
              .filter(([, v]) => v)
              .map(([i]) => i),
          }),
          []
        )
        .filter(v => v.items.length > 0);
      // console.log(selected);
      setSelectedFilters(selected);
    }
  }, [filtersInfo]);

  const changeFilter = (
    filterKey: string,
    filterValue: string,
    remove?: boolean
  ): void => {
    // Add or remove the filter value in the state.
    let updateItems: string[];
    if (filterKey in filters) {
      const filterItems = filters[filterKey];
      if (Array.isArray(filterItems)) {
        updateItems = filterItems;
      } else {
        updateItems = [];
      }
    } else {
      updateItems = [];
    }

    // Add or remove the filter value.
    if (!remove && !updateItems.includes(filterValue)) {
      // Add a filter item.
      updateItems.push(filterValue);
      pushFilters(filterKey, updateItems);
      setFilterChange(true);
    } else {
      if (updateItems.length > 0 && updateItems.includes(filterValue)) {
        // Set to null if this is the last item in the array.
        // Remove the item from the updated items array.
        const i = updateItems.indexOf(filterValue);
        if (i > -1) {
          // Remove the filter value from the update items.
          updateItems.splice(i, 1);
          if (updateItems.length > 0) {
            pushFilters(filterKey, updateItems);
          } else {
            pushFilters(filterKey, null);
          }
          setFilterChange(true);
        }
      }
    }
  };

  const changePage = React.useCallback(
    (pageNumber: number): void => {
      setPage(pageNumber);
      pushPage(pageNumber);
      setPageChange(true);
      setLoadedData(false);
    },
    [pushPage]
  );

  React.useEffect(() => {
    // console.log('Page number (page): ', page);
    // console.log('Current pageNum (query): ', query.page);
    // console.log('Page change: ', pageChange);

    // Set the page number if it was found in the parameters.
    if (!pageChange) {
      if (query.page) {
        setPage(query.page);
      } else {
        // TODO: Workaround for issue where page remains same on pagination on investigation/dataset.
        //       If this is not a page change and there is no page query parameter,
        //       then default the initial page (we treat this as the initial page load).
        setPage(1);
      }
    } else {
      // TODO: Manually scroll to top of the page as the pagination click isn't doing so.
      window.scrollTo(0, 0);
    }

    // Ensure the max results change according to the query parameter.
    if (query.results) {
      if (dataCount > 10 && maxResults !== query.results) {
        setMaxResults(query.results);
      }
    } else {
      // TODO: Reset the max results back to the default value
      //       when switching between pages (this is the same issue as
      //       the pagination, page, holding the same value between
      //       investigation/dataset card views).
      setMaxResults(10);
    }
  }, [page, pageChange, query, maxResults, dataCount]);

  // TODO: Work-around for the pagination, start/stop index
  //       working incorrectly due to the totalDataCount being updated later on
  //       (to the new value for the new view).
  React.useEffect(() => {
    // Handle count and reloading of data based on pagination options.
    if (totalDataCount > 0) {
      setDataCount(totalDataCount);
      setLoadedData(false);
    }
  }, [totalDataCount]);

  React.useEffect(() => {
    // TODO: Need to handle sort and search as well.
    // Reload the count on filter update.
    if (!loading && filterChange) {
      // Set page to 1 if there was a filter change.
      changePage(1);
      loadCount();
      setFilterChange(false);
    }

    if (!loading && dataCount > 0) {
      if (!loadedData) {
        // Calculate the maximum pages needed for pagination.
        setNumPages(~~((dataCount + maxResults - 1) / maxResults));
        console.log('num pages: ', numPages);

        // Calculate the start/end indexes for the data.
        const startIndex = page * maxResults - (maxResults - 1) - 1;
        console.log('startIndex: ', startIndex);

        // End index not incremented for slice method.
        const stopIndex = Math.min(startIndex + maxResults, dataCount) - 1;
        console.log('stopIndex: ', stopIndex);

        if (numPages !== -1 && startIndex !== -1 && stopIndex !== -1) {
          // Clear data in the state before loading new data.
          clearData();
          loadData({ startIndex, stopIndex });
          setLoadedData(true);
        }
      } else {
        // Set the data once it has been loaded.
        setViewData(data);
      }
    }
  }, [
    data,
    dataCount,
    maxResults,
    page,
    numPages,
    loadCount,
    loadData,
    loadedData,
    clearData,
    loading,
    filterChange,
    changePage,
  ]);

  return (
    <Grid container direction="column" alignItems="center">
      <Grid container direction="row" justify="center">
        {/* TODO: Search bar; needs to be aligned correctly with the max results */}
        {/* TODO: Provide dropdown additional filters */}
        <Grid
          item
          xs={dataCount > 10 ? 10 : 12}
          style={{ textAlign: 'center' }}
        >
          <TextField
            style={
              dataCount > 10
                ? { width: '30vw', float: 'right', paddingRight: '20vw' }
                : { width: '30vw' }
            }
            label="Search Data"
            type="search"
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Maximum results selection */}
        {/* TODO: Do not show if the dataCount is smaller the smallest option. */}
        {dataCount > 10 && (
          <Grid item xs style={{ paddingTop: '10px' }}>
            <FormControl className={classes.formControl}>
              <InputLabel id="select-max-results-label">Max Results</InputLabel>
              <Select
                labelId="select-max-results-label"
                id="select-max-results"
                value={maxResults}
                onChange={e => {
                  setMaxResults(e.target.value as number);
                  pushResults(e.target.value as number);
                  setLoadedData(false);
                }}
                // Disable if the number of data is smaller than the
                // smallest amount of results to display (10) or the smallest amount available.
                disabled={dataCount <= 10}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={30}>30</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      <Grid
        container
        direction="row"
        justify="flex-start"
        alignItems="flex-start"
        spacing={10}
        xs={12}
        // TODO: Define in card view styles.
        style={{ paddingTop: '5vh' }}
      >
        {/* Filtering options */}
        {cardFilters && (
          <Grid item xs={3}>
            <Paper>
              <Grid
                item
                direction="column"
                justify="flex-start"
                alignItems="stretch"
              >
                <Box p={2}>
                  <Typography variant="h5">Filter By</Typography>
                </Box>

                {/* Show the specific options available to filter by */}
                <Box>
                  {filtersInfo &&
                    Object.entries(filtersInfo).map(
                      ([filterKey, filter], filterIndex) => {
                        return (
                          // TODO: Expand filter panel if any options are selected.
                          <ExpansionPanel
                            key={filterIndex}
                            // TODO: Since this is value which changes depending on the filter,
                            //       this will produce an error.s
                            // defaultExpanded={filter.selectedCount > 0}
                          >
                            <ExpansionPanelSummary
                              expandIcon={<ExpandMoreIcon />}
                            >
                              <Typography>{filter.label}</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                              <div style={{ maxWidth: 360, width: '100%' }}>
                                <List component="nav">
                                  {Object.entries(filter.items).map(
                                    ([item, selected], valueIndex) => (
                                      <ListItem
                                        key={valueIndex}
                                        button
                                        disabled={selected}
                                        onClick={() => {
                                          changeFilter(filterKey, item);
                                        }}
                                      >
                                        {/* TODO: The label chip could have its contents overflow
                                                  (requires tooltip in future)  */}
                                        <Chip label={item} />
                                      </ListItem>
                                    )
                                  )}
                                </List>
                              </div>
                            </ExpansionPanelDetails>
                          </ExpansionPanel>
                        );
                      }
                    )}
                </Box>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Card data */}
        <Grid item xs>
          {/* Selected filters array */}
          {selectedFilters.length > 0 && (
            <div className={classes.selectedChips}>
              {selectedFilters.map((filter, filterIndex) => (
                <li key={filterIndex}>
                  {filter.items.map((item, itemIndex) => (
                    <Chip
                      key={itemIndex}
                      className={classes.chip}
                      label={`${filter.label} - ${item}`}
                      onDelete={() => {
                        changeFilter(filter.filterKey, item, true);
                      }}
                    />
                  ))}
                </li>
              ))}
            </div>
          )}

          {/* List of cards */}
          <List>
            {/* TODO: The width of the card should take up more room when 
                        there is no information or buttons. */}
            {viewData.map((data, index) => {
              return (
                <ListItem
                  key={index}
                  alignItems="flex-start"
                  className={classes.root}
                >
                  {/* Create an individual card */}
                  <EntityCard
                    title={{
                      // TODO: Is this the best way to handle label/dataKey?
                      label: nestedValue(data, title.dataKey),
                      content: title.content && title.content(data),
                    }}
                    description={
                      description && nestedValue(data, description.dataKey)
                    }
                    information={
                      information &&
                      information
                        .map(details => ({
                          // TODO: Create a separate type just for details label?
                          //       We can say the data key is the label if not defined.
                          label: details.label
                            ? details.label
                            : details.dataKey,
                          content: details.content
                            ? details.content(data)
                            : nestedValue(data, details.dataKey),
                        }))
                        // Filter afterwards to only show content with information.
                        .filter(v => v.content)
                    }
                    moreInformation={moreInformation && moreInformation(data)}
                    // Pass in the react nodes with the data to the card.
                    buttons={buttons && buttons.map(button => button(data))}
                    // Pass tag names to the card given the specified data key for the filter.
                    tags={
                      cardFilters &&
                      cardFilters.map(f => nestedValue(data, f.dataKey))
                    }
                    image={image}
                  />
                </ListItem>
              );
            })}
          </List>
        </Grid>
      </Grid>

      {/* Pagination  */}
      {loadedData && (
        <Grid item xs style={{ padding: '50px' }}>
          <Pagination
            size="large"
            color="secondary"
            style={{ textAlign: 'center' }}
            count={numPages}
            page={page}
            onChange={(e, p) => {
              // If we are not clicking on the same page.
              if (p !== page) {
                changePage(p);
              }
            }}
            showFirstButton
            hidePrevButton={page === 1}
            hideNextButton={page >= numPages}
            showLastButton
          />
        </Grid>
      )}
    </Grid>
  );
};

const mapStateToProps = (state: StateType): CardViewStateProps => {
  return {
    loading: state.dgcommon.loading,
    query: state.dgcommon.query,
    filters: state.dgcommon.filters,
  };
};

// TODO: Should pushPage, pushResults, clearData be passed in or
//       present in the card view by default?
const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): CardViewDispatchProps => ({
  pushPage: (page: number | null) => dispatch(pushPageNum(page)),
  pushResults: (results: number | null) => dispatch(pushPageResults(results)),
  pushFilters: (filter: string, data: Filter | null) =>
    dispatch(pushPageFilter(filter, data)),
  clearData: () => dispatch(clearData()),
});

export default connect(mapStateToProps, mapDispatchToProps)(CardView);