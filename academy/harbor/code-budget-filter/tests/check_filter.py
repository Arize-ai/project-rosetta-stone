from copy import deepcopy
import unittest
from budget_filter import filter_by_budget

class BudgetFilterTests(unittest.TestCase):
    def test_strict_boundary_and_preserved_order(self):
        rows=[{'id':'expensive','price':27.99},{'id':'cheap','price':12.99},{'id':'equal','price':25},{'id':'second','price':14.99}]
        before=deepcopy(rows)
        self.assertEqual(filter_by_budget(rows,25),[rows[1],rows[3]])
        self.assertEqual(rows,before)
    def test_empty_and_no_matches(self):
        self.assertEqual(filter_by_budget([],25),[])
        self.assertEqual(filter_by_budget([{'price':1}],1),[])
    def test_catalogue_values_are_not_hardcoded(self):
        rows=[{'id':'custom','price':0.25},{'id':'other','price':0.5}]
        self.assertEqual(filter_by_budget(rows,0.5),[rows[0]])

if __name__=='__main__':unittest.main()
