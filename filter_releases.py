"""Helper Functions to be used for sorting and filtering."""
from datetime import datetime


def filter_releases(releases, state, branch, type, start_date, end_date, datetype):
  """Filters by all of the criteria.

  Args:
    releases: dictionary of release objects
    state: int representation of a state
    branch: string branch
    type: string type
    start_date: unix datetime of the beginning of a time period
    end_date: unix datetime of the end of a time period
    datetype: string determing which date (creation or last_modified) is
              filtered by the time period

  Returns:
    Array of releases that is filtered by the arguments.
  """

  # convert and validate inputs
  state = int(state)
  if state < 0 or state > 4:
    state = 0

  now = datetime.now()
  start_date = datetime.fromtimestamp(int(start_date))
  if start_date < datetime.fromtimestamp(0) or start_date > now:
    start_date = datetime.fromtimestamp(0)

  end_date = datetime.fromtimestamp(int(end_date))
  if end_date <= datetime.fromtimestamp(0):
    end_date = now

  branch = str(branch)
  if branch == 'null':
    branch = None

  type = str(type)
  if type == 'null':
    type = None

  filtered = []
  for release in releases.values():
    # If invalid datetype will default to started
    if datetype == 'last_modified':
      check_date = release.last_modified
    else:
      check_date = release.started

    if check_date >= start_date and check_date <= end_date:
      should_append = False
      if release.state == state or state == 0:
        should_append = True
      if branch and should_append:
        should_append = (release.branch == branch)
      if type and should_append:
        should_append = (release.type == type)
      if should_append:
        filtered.append(release)

  return filtered


class Sorting(object):
  BY_NAME = 1
  BY_CREATION = 2
  BY_LAST_MODIFIED = 3
  BY_LAST_ACTIVE = 4


def sort(releases, sort_method, reverse):
  """Sorts 'releases' according to 'sort_method'.

  Args:
    releases: array of release objects
    sort_method: int representation of a sort_method
    reverse: int representing bool descending

  Returns:
    Array 'releases' in a sorted order.
  """
  sort_method = int(sort_method)
  reverse = bool(int(reverse))
  if sort_method == Sorting.BY_NAME:
    result = sorted(releases, key=lambda k: k.name, reverse=reverse)
  elif sort_method == Sorting.BY_CREATION:
    result = sorted(releases, key=lambda k: k.started, reverse=reverse)
  elif sort_method == Sorting.BY_LAST_MODIFIED:
    result = sorted(releases, key=lambda k: k.last_modified, reverse=reverse)
  elif sort_method == Sorting.BY_LAST_ACTIVE:
    result = sorted(releases, key=lambda k: k.last_active_task, reverse=reverse)
  return result
