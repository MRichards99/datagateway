import React, { useEffect } from 'react';
import { StateType } from './state/app.types';
import { connect } from 'react-redux';

import { Grid, Typography, Paper } from '@material-ui/core';
import PageBreadcrumbs from './breadcrumbs.component';
import PageTable from './pageTable.component';
import { Route } from 'react-router';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { fetchDownloadCart } from 'datagateway-common';

interface PageContainerStoreProps {
  entityCount: number;
}

interface PageContainerDispatchProps {
  fetchDownloadCart: () => Promise<void>;
}

type PageContainerCombinedProps = PageContainerStoreProps &
  PageContainerDispatchProps;

const PageContainer = (
  props: PageContainerCombinedProps
): React.ReactElement => {
  const { entityCount, fetchDownloadCart } = props;

  const dgDataviewElement = document.getElementById('datagateway-dataview');

  useEffect(() => {
    if (dgDataviewElement) {
      fetchDownloadCart();
    }
  }, [dgDataviewElement, fetchDownloadCart]);

  return (
    <Grid container>
      {/* Hold the breadcrumbs at top left of the page. */}
      <Grid item xs aria-label="container-breadcrumbs">
        {/* don't show breadcrumbs on /my-data - only on browse */}
        <Route path="/browse" component={PageBreadcrumbs} />
      </Grid>

      {/* The table entity count takes up an xs of 2, where the breadcrumbs
           will take the remainder of the space. */}
      <Grid
        style={{ textAlign: 'center' }}
        item
        xs={2}
        aria-label="container-table-count"
      >
        <Paper square>
          <Typography variant="h6" component="h3">
            <b>Results:</b> {entityCount}
          </Typography>
        </Paper>
      </Grid>

      {/* Hold the table for remainder of the page */}
      <Grid item xs={12} aria-label="container-table">
        {/* Place table in Paper component which adjusts for the height
             of the AppBar (64px) on parent application and the breadcrumbs component (31px). */}
        <Paper square style={{ height: 'calc(100vh - 95px)', width: '100%' }}>
          <PageTable />
        </Paper>
      </Grid>
    </Grid>
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): PageContainerDispatchProps => ({
  fetchDownloadCart: () => dispatch(fetchDownloadCart()),
});
const mapStateToProps = (state: StateType): PageContainerStoreProps => ({
  entityCount: state.dgcommon.totalDataCount,
});

export default connect(mapStateToProps, mapDispatchToProps)(PageContainer);