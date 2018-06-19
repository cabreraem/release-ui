#--------File Adapter for Fake Data-------#

import abc
from ReleaseDataABC import ReleaseData
import json

class FileAdapter(ReleaseData):

    # Constructor takes two files: release data and task data
    def __init__(self, releasesFile, tasksFile):
        json_data = open(releasesFile).read()
        self.releases = json.loads(json_data)
        json_data = open(tasksFile).read()
        self.tasks = json.loads(json_data)

    def getReleases(self):
        return self.releases

    def getTasks(self):
        return self.tasks

    def getLabels(self):
        labels = []
        for release in self.releases:
            for label in self.releases[release]['labels']:
                if label not in labels:
                    labels.append(label)
        return labels