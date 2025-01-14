import React from 'react';
import { Entity, Investigation } from 'datagateway-common';
import {
  Typography,
  Grid,
  createStyles,
  makeStyles,
  Theme,
  Divider,
  Tabs,
  Tab,
  Link,
} from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import { Action } from 'redux';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    divider: {
      marginBottom: theme.spacing(2),
    },
  })
);

interface InvestigationDetailsPanelProps {
  rowData: Entity;
  fetchDetails: (investigationId: number) => Promise<void>;
  detailsPanelResize?: () => void;
  viewDatasets?: (id: number) => Action;
}

const InvestigationDetailsPanel = (
  props: InvestigationDetailsPanelProps
): React.ReactElement => {
  const { rowData, fetchDetails, viewDatasets, detailsPanelResize } = props;
  const [value, setValue] = React.useState<
    'details' | 'users' | 'samples' | 'publications'
  >('details');

  const [t] = useTranslation();

  const classes = useStyles();

  const investigationData = rowData as Investigation;

  React.useEffect(() => {
    if (
      !investigationData.INVESTIGATIONUSER ||
      !investigationData.SAMPLE ||
      !investigationData.PUBLICATION
    ) {
      fetchDetails(investigationData.ID);
    }
  }, [
    investigationData.INVESTIGATIONUSER,
    investigationData.SAMPLE,
    investigationData.PUBLICATION,
    investigationData.ID,
    fetchDetails,
  ]);

  React.useLayoutEffect(() => {
    if (detailsPanelResize) detailsPanelResize();
  }, [value, detailsPanelResize]);

  return (
    <div id="details-panel" style={{ minWidth: 0 }}>
      <Tabs
        variant="scrollable"
        scrollButtons="auto"
        value={value}
        onChange={(event, newValue) => setValue(newValue)}
        aria-label={t('investigations.details.tabs_label')}
      >
        <Tab
          id="investigation-details-tab"
          aria-controls="investigation-details-panel"
          label={t('investigations.details.label')}
          value="details"
        />
        {investigationData.INVESTIGATIONUSER && (
          <Tab
            id="investigation-users-tab"
            aria-controls="investigation-users-panel"
            label={t('investigations.details.users.label')}
            value="users"
          />
        )}
        {investigationData.SAMPLE && (
          <Tab
            id="investigation-samples-tab"
            aria-controls="investigation-samples-panel"
            label={t('investigations.details.samples.label')}
            value="samples"
          />
        )}
        {investigationData.PUBLICATION && (
          <Tab
            id="investigation-publications-tab"
            aria-controls="investigation-publications-panel"
            label={t('investigations.details.publications.label')}
            value="publications"
          />
        )}
        {viewDatasets && (
          <Tab
            id="investigation-datasets-tab"
            label={t('investigations.details.datasets')}
            onClick={() => viewDatasets(investigationData.ID)}
          />
        )}
      </Tabs>
      <div
        id="investigation-details-panel"
        aria-labelledby="investigation-details-tab"
        role="tabpanel"
        hidden={value !== 'details'}
      >
        <Grid container className={classes.root} direction="column">
          <Grid item xs>
            <Typography variant="h6">
              <b>{investigationData.NAME}</b>
            </Typography>
            <Divider className={classes.divider} />
          </Grid>
          <Grid item xs>
            <Typography variant="overline">
              {t('investigations.details.title')}
            </Typography>
            <Typography>
              <b>{investigationData.TITLE}</b>
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant="overline">
              {t('investigations.details.visit_id')}
            </Typography>
            <Typography>
              <b>{investigationData.VISIT_ID}</b>
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant="overline">
              {t('investigations.details.summary')}
            </Typography>
            <Typography>
              <b>{investigationData.SUMMARY}</b>
            </Typography>
          </Grid>
          {investigationData.STUDYINVESTIGATION &&
            investigationData.STUDYINVESTIGATION.map((studyInvestigation) => {
              if (studyInvestigation.STUDY) {
                return (
                  <Grid key={studyInvestigation.ID} item xs>
                    <Typography variant="overline">
                      {t('investigations.details.pid')}
                    </Typography>
                    <Typography>
                      <Link
                        href={`https://doi.org/${studyInvestigation.STUDY.PID}`}
                      >
                        {studyInvestigation.STUDY.PID}
                      </Link>
                    </Typography>
                  </Grid>
                );
              } else {
                return null;
              }
            })}
          <Grid item xs>
            <Typography variant="overline">
              {t('investigations.details.doi')}
            </Typography>
            <Typography>
              <b>{investigationData.DOI}</b>
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant="overline">
              {t('investigations.details.start_date')}
            </Typography>
            <Typography>
              <b>{investigationData.STARTDATE}</b>
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant="overline">
              {t('investigations.details.end_date')}
            </Typography>
            <Typography>
              <b>{investigationData.ENDDATE}</b>
            </Typography>
          </Grid>
        </Grid>
      </div>
      {investigationData.INVESTIGATIONUSER && (
        <div
          id="investigation-users-panel"
          aria-labelledby="investigation-users-tab"
          role="tabpanel"
          hidden={value !== 'users'}
        >
          <Grid container className={classes.root} direction="column">
            {investigationData.INVESTIGATIONUSER.map((investigationUser) => {
              if (investigationUser.USER_) {
                return (
                  <Grid key={investigationUser.USER_ID} item xs>
                    <Typography variant="overline">
                      {t('investigations.details.users.name')}
                    </Typography>
                    <Typography>
                      <b>
                        {investigationUser.USER_.FULLNAME ||
                          investigationUser.USER_.NAME}
                      </b>
                    </Typography>
                  </Grid>
                );
              } else {
                return null;
              }
            })}
          </Grid>
        </div>
      )}
      {investigationData.SAMPLE && (
        <div
          id="investigation-samples-panel"
          aria-labelledby="investigation-samples-tab"
          role="tabpanel"
          hidden={value !== 'samples'}
        >
          <Grid container className={classes.root} direction="column">
            {investigationData.SAMPLE.map((sample) => {
              return (
                <Grid key={sample.ID} item xs>
                  <Typography variant="overline">
                    {t('investigations.details.samples.name')}
                  </Typography>
                  <Typography>
                    <b>{sample.NAME}</b>
                  </Typography>
                </Grid>
              );
            })}
          </Grid>
        </div>
      )}
      {investigationData.PUBLICATION && (
        <div
          id="investigation-publications-panel"
          aria-labelledby="investigation-publications-tab"
          role="tabpanel"
          hidden={value !== 'publications'}
        >
          <Grid container className={classes.root} direction="column">
            {investigationData.PUBLICATION.map((publication) => {
              return (
                <Grid key={publication.ID} item xs>
                  <Typography variant="overline">
                    {t('investigations.details.publications.reference')}
                  </Typography>
                  <Typography>
                    <b>{publication.FULLREFERENCE}</b>
                  </Typography>
                </Grid>
              );
            })}
          </Grid>
        </div>
      )}
    </div>
  );
};

export default InvestigationDetailsPanel;
