<?php

require_once 'AbstractViperTableEditorPluginUnitTest.php';

class Viper_Tests_ViperTableEditorPlugin_ColumnUnitTest extends AbstractViperTableEditorPluginUnitTest
{


    /**
     * Test that correct column icons appear in the toolbar.
     *
     * @return void
     */
    public function testColumnToolIconsCorrect()
    {
        $this->useTest(1);

        $this->insertTable(1);
        sleep(1);
        $this->showTools(1, 'col');
        sleep(1);

        $this->assertTrue($this->inlineToolbarButtonExists('tableSettings', 'selected'));
        $this->assertTrue($this->inlineToolbarButtonExists('addLeft'));
        $this->assertTrue($this->inlineToolbarButtonExists('addRight'));
        $this->assertTrue($this->inlineToolbarButtonExists('mergeLeft'));
        $this->assertTrue($this->inlineToolbarButtonExists('mergeRight'));
        $this->assertTrue($this->inlineToolbarButtonExists('delete'));
        $this->assertTrue($this->fieldExists('Width'));
        $this->assertTrue($this->fieldExists('Heading'));
        $this->assertTrue($this->inlineToolbarButtonExists('Apply Changes', 'disabled', TRUE));

    }//end testColumnToolIconsCorrect()


    /**
     * Test changing the width of columns.
     *
     * @return void
     */
    public function testChangingColumnWidth()
    {
        $this->useTest(1);

        $this->insertTable(1);

        // Change the width of the first column and click Apply Changes
        $this->showTools(0, 'col');
        $this->clickField('Width');
        $this->type('50');
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th style="width: 50px;"></th><th></th><th></th><th></th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Change the width of the last column and press enter
        $this->showTools(3, 'col');
        $this->clickField('Width');
        $this->type('100');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th style="width: 50px;"></th><th></th><th></th><th style="width: 100px;"></th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

    }//end testChangingColumnWidth()


    /**
     * Test changing the width of columns and clicking undo and redo.
     *
     * @return void
     */
    public function testChangingColumnWidthAndClickingUndo()
    {
        $this->useTest(1);

        $this->insertTable(1);

        // Change the width of the first column
        $this->showTools(0, 'col');
        $this->clickField('Width');
        $this->type('50');
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->moveToKeyword(1);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th style="width: 50px;"></th><th></th><th></th><th></th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

        $this->clickTopToolbarButton('historyUndo');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th></th><th></th><th></th><th></th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

        $this->clickTopToolbarButton('historyRedo');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th style="width: 50px;"></th><th></th><th></th><th></th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

    }//end testChangingColumnWidthAndClickingUndo()


    /**
     * Test adding a new table without headers and then changing the settings of columns.
     *
     * @return void
     */
    public function testColumnsInANewTableWithoutHeaders()
    {
        $this->useTest(1);

        $this->insertTable(1, 0);
        $this->clickCell(0);
        $this->type('One');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Two');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Three');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Four');

        $this->showTools(2, 'col');

        // Add a new column after the third column of the table
        $this->clickInlineToolbarButton('addRight');
        // Add a new column before the third column of the table
        $this->clickInlineToolbarButton('addLeft');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><td>One</td><td>Two</td><td></td><td>Three</td><td></td><td>Four</td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Delete the third column
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('delete');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><td>One</td><td>Two</td><td>Three</td><td></td><td>Four</td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the second column left
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeLeft');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><td>One</td><td>Three</td><td>Two</td><td></td><td>Four</td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the third column right
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeRight');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><td>One</td><td>Three</td><td></td><td>Two</td><td>Four</td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Change the first colum to be a header column
        $this->showTools(0, 'col');
        $this->clickField('Heading');
        sleep(1);
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><th>One</th><td>Three</td><td></td><td>Two</td><td>Four</td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

    }//end testColumnsInANewTableWithoutHeaders()


    /**
     * Test adding a new table with left headers and then adding new columns.
     *
     * @return void
     */
    public function testColumnsInANewTableWithLeftHeaders()
    {
        $this->useTest(1);

        $this->insertTable(1, 1);
        $this->clickCell(0);
        $this->type('One');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Two');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Three');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Four');

        $this->showTools(1, 'col');

        //Add a new column before the second column in the table
        $this->clickInlineToolbarButton('addLeft');
        //Add a new column after the first column of the table
        $this->showTools(0, 'col');
        $this->clickInlineToolbarButton('addRight');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><th>One</th><th></th><td></td><td>Two</td><td>Three</td><td>Four</td></tr><tr><th></th><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        //Delete the second column
        $this->showTools(1, 'col');
        $this->clickInlineToolbarButton('delete');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><th>One</th><td></td><td>Two</td><td>Three</td><td>Four</td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the third column left
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeLeft');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><th>One</th><td>Two</td><td></td><td>Three</td><td>Four</td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the third column right
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeRight');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><th>One</th><td>Two</td><td>Three</td><td></td><td>Four</td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Change the first colum not to be a header column
        $this->showTools(0, 'col');
        $this->clickField('Heading');
        sleep(1);
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><td>One</td><td>Two</td><td>Three</td><td></td><td>Four</td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Change the third colum not to be a header column
        $this->showTools(2, 'col');
        $this->clickField('Heading');
        sleep(1);
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><tbody><tr><td>One</td><td>Two</td><th>Three</th><td></td><td>Four</td></tr><tr><td></td><td></td><th></th><td></td><td></td></tr><tr><td></td><td></td><th></th><td></td><td></td></tr></tbody></table>');


    }//end testColumnsInANewTableWithLeftHeaders()


    /**
     * Test adding a new table with top headers and then adding new columns.
     *
     * @return void
     */
    public function testColumnsInANewTableWithTopHeaders()
    {
        $this->useTest(1);

        $this->insertTable(1);
        $this->clickCell(0);
        $this->type('One');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Two');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Three');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Four');

        $this->showTools(1, 'col');

        //Add a new column before the second column in the table
        $this->clickInlineToolbarButton('addLeft');
        //Add a new column after the first column of the table
        $this->showTools(0, 'col');
        $this->clickInlineToolbarButton('addRight');

        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th></th><th></th><th>Two</th><th>Three</th><th>Four</th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        //Delete the second column
        $this->showTools(1, 'col');
        $this->clickInlineToolbarButton('delete');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th></th><th>Two</th><th>Three</th><th>Four</th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the third column left
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeLeft');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th>Two</th><th></th><th>Three</th><th>Four</th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the third column right
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeRight');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th>Two</th><th>Three</th><th></th><th>Four</th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Change the first colum to be a header column
        $this->showTools(0, 'col');
        $this->clickField('Heading');
        sleep(1);
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th>Two</th><th>Three</th><th></th><th>Four</th></tr></thead><tbody><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Change the third colum to be a header column
        $this->showTools(2, 'col');
        $this->clickField('Heading');
        sleep(1);
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th>Two</th><th>Three</th><th></th><th>Four</th></tr></thead><tbody><tr><th></th><td></td><th></th><td></td><td></td></tr><tr><th></th><td></td><th></th><td></td><td></td></tr></tbody></table>');

    }//end testColumnsInANewTableWithTopHeaders()


    /**
     * Test adding a new table with both headers and then adding new columns.
     *
     * @return void
     */
    public function testColumnsInANewTableWithBothHeaders()
    {

        $this->useTest(1);

        $this->insertTable(1, 3);
        $this->clickCell(0);
        $this->type('One');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Two');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Three');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Four');

        $this->showTools(1, 'col');

        //Add a new column before the second column in the table
        $this->clickInlineToolbarButton('addLeft');
        //Add a new column after the first column of the table
        $this->showTools(0, 'col');
        $this->clickInlineToolbarButton('addRight');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th></th><th></th><th>Two</th><th>Three</th><th>Four</th></tr></thead><tbody><tr><th></th><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        //Delete the second column
        $this->showTools(1, 'col');
        $this->clickInlineToolbarButton('delete');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th></th><th>Two</th><th>Three</th><th>Four</th></tr></thead><tbody><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the third column left
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeLeft');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th>Two</th><th></th><th>Three</th><th>Four</th></tr></thead><tbody><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Move the third column right
        $this->showTools(2, 'col');
        $this->clickInlineToolbarButton('mergeRight');
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th>Two</th><th>Three</th><th></th><th>Four</th></tr></thead><tbody><tr><th></th><td></td><td></td><td></td><td></td></tr><tr><th></th><td></td><td></td><td></td><td></td></tr></tbody></table>');

        // Change the third colum to be a header column
        $this->showTools(2, 'col');
        $this->clickField('Heading');
        sleep(1);
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><th>One</th><th>Two</th><th>Three</th><th></th><th>Four</th></tr></thead><tbody><tr><th></th><td></td><th></th><td></td><td></td></tr><tr><th></th><td></td><th></th><td></td><td></td></tr></tbody></table>');

        // Change the first colum not to be a header column
        $this->showTools(0, 'col');
        $this->clickField('Heading');
        sleep(1);
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatchNoHeaders('<p>Test %1%</p><table border="1" style="width: 100%;"><thead><tr><td>One</td><th>Two</th><th>Three</th><th></th><th>Four</th></tr></thead><tbody><tr><td></td><td></td><th></th><td></td><td></td></tr><tr><td></td><td></td><th></th><td></td><td></td></tr></tbody></table>');


    }//end testColumnsInANewTableWithBothHeaders()


    /**
     * Test that the 'By Genders' colspan changes to three when you add a new column and goes back to two when you delete a new column.
     *
     * @return void
     */
    public function testColspanChangesWhenNewColumnAdded()
    {
        $this->useTest(2, null);

        $this->showTools(5, 'col');
        $this->clickInlineToolbarButton('addRight');
        $this->clickInlineToolbarButton('addLeft');
        $this->assertHTMLMatchNoHeaders('<table style="width: 300px;" border="1" cellspacing="2" cellpadding="2"><tbody><tr><td style="width: 100px;" colspan="2">Survey</td><td rowspan="2">All Genders</td><td></td><td style="width: 100px;" colspan="3">By Gender</td></tr><tr><td></td><td></td><td></td><td>Male</td><td></td><td>Females</td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

        $this->showTools(8, 'col');
        $this->clickInlineToolbarButton('delete');
        $this->assertHTMLMatchNoHeaders('<table style="width: 300px;" border="1" cellspacing="2" cellpadding="2"><tbody><tr><td style="width: 100px;" colspan="2">Survey</td><td rowspan="2">All Genders</td><td></td><td style="width: 100px;" colspan="2">By Gender</td></tr><tr><td></td><td></td><td></td><td>Male</td><td>Females</td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>');

    }//end testColspanChangesWhenNewColumnAdded()


    /**
     * Test that the 'By Gender' colspan changes when you delete the last column from the table.
     *
     * @return void
     */
    public function testColspanChangesWhenYouDeleteTheLastColumn()
    {
        $this->useTest(3, null);

        $this->showTools(6, 'col');
        $this->clickInlineToolbarButton('delete');
        $this->assertHTMLMatchNoHeaders('<table style="width: 300px;" border="1" cellspacing="2" cellpadding="2"><tbody><tr><td style="width: 100px;" colspan="2">Survey</td><td rowspan="2">All Genders</td><td style="width: 100px;">By Gender</td></tr><tr><td></td><td></td><td>Male</td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');


    }//end testColspanChangesWhenYouDeleteTheLastColumn()


    /**
     * Test that the 'By Gender' colspan changes when you delete the first column of the merged cell.
     *
     * @return void
     */
    public function testColspanChangesWhenYouDeleteTheFirstColumnOfMergedCell()
    {
        $this->useTest(4, null);

        $this->showTools(5, 'col');
        $this->clickInlineToolbarButton('delete');
        $this->assertHTMLMatchNoHeaders('<table style="width: 300px;" border="1" cellspacing="2" cellpadding="2"><tbody><tr><td style="width: 100px;" colspan="2">Survey</td><td rowspan="2">All Genders</td><td style="width: 100px;">By Gender</td></tr><tr><td></td><td></td><td>Females</td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');


    }//end testColspanChangesWhenYouDeleteTheFirstColumnOfMergedCell()


    /**
     * Test the move icons for a column.
     *
     * @return void
     */
    public function testMoveIconsInTheColumnToolbar()
    {
        $this->useTest(1);

        $this->insertTable(1);
        sleep(1);
        $this->showTools(0, 'col');
        sleep(1);

        $this->assertTrue($this->inlineToolbarButtonExists('mergeRight'), 'Move column right should be enabled');
        $this->assertTrue($this->inlineToolbarButtonExists('mergeLeft', 'disabled'), 'Move column left should not be enabled');

        $this->showTools(3, 'col');
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('mergeRight', 'disabled'), 'Move column right should not be enabled');
        $this->assertTrue($this->inlineToolbarButtonExists('mergeLeft'), 'Move column left should be enabled');

        $this->showTools(2, 'col');
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('mergeRight'), 'Move column right should be enabled');
        $this->assertTrue($this->inlineToolbarButtonExists('mergeLeft'), 'Move column left should be enabled');

        $this->showTools(1, 'col');
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('mergeRight'), 'Move column right should be enabled');
        $this->assertTrue($this->inlineToolbarButtonExists('mergeLeft'), 'Move column left should be enabled');

    }//end testMoveIconsInTheColumnToolbar()


    /**
     * Test that header ids are removed from the table when you remove a header column.
     *
     * @return void
     */
    public function testHeaderIdsRemovedWhenYouRemoveHeaderColumn()
    {
        $this->useTest(1);

        $this->insertTableWithSpecificId('test', 3, 4, 1, 1);

        $this->assertHTMLMatch('<p>Test %1%</p><table style="width: 100%;" id="test" border="1"><tbody><tr><th id="testr1c1"></th><td headers="testr1c1"></td><td headers="testr1c1"></td><td headers="testr1c1"></td></tr><tr><th id="testr2c1"></th><td headers="testr2c1"></td><td headers="testr2c1"></td><td headers="testr2c1"></td></tr><tr><th id="testr3c1"></th><td headers="testr3c1"></td><td headers="testr3c1"></td><td headers="testr3c1"></td></tr></tbody></table>');

        $this->showTools(0, 'col');
        $this->clickField('Heading');
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatch('<p>Test %1%</p><table style="width: 100%;" id="test" border="1"><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

        $this->clickField('Heading');
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);

        $this->assertHTMLMatch('<p>Test %1%</p><table style="width: 100%;" id="test" border="1"><tbody><tr><th id="testr1c1"></th><td headers="testr1c1"></td><td headers="testr1c1"></td><td headers="testr1c1"></td></tr><tr><th id="testr2c1"></th><td headers="testr2c1"></td><td headers="testr2c1"></td><td headers="testr2c1"></td></tr><tr><th id="testr3c1"></th><td headers="testr3c1"></td><td headers="testr3c1"></td><td headers="testr3c1"></td></tr></tbody></table>');

    }//end testHeaderIdsRemovedWhenYouRemoveHeaderColumn()


    /**
     * Test that undo/redo is only one event for converting header cell to a normal cell.
     *
     * @return void
     */
    public function testUndoRedoForHeaderToNormalCellConversion()
    {
        $this->useTest(1);

        $this->insertTableWithSpecificId('test', 3, 4, 1, 1);

        $this->assertHTMLMatch('<p>Test %1%</p><table style="width: 100%;" id="test" border="1"><tbody><tr><th id="testr1c1"></th><td headers="testr1c1"></td><td headers="testr1c1"></td><td headers="testr1c1"></td></tr><tr><th id="testr2c1"></th><td headers="testr2c1"></td><td headers="testr2c1"></td><td headers="testr2c1"></td></tr><tr><th id="testr3c1"></th><td headers="testr3c1"></td><td headers="testr3c1"></td><td headers="testr3c1"></td></tr></tbody></table>');

        $this->showTools(0, 'col');
        $this->clickField('Heading');
        $this->clickInlineToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatch('<p>Test %1%</p><table style="width: 100%;" id="test" border="1"><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

        $this->clickTopToolbarButton('historyUndo');

        $this->assertHTMLMatch('<p>Test %1%</p><table style="width: 100%;" id="test" border="1"><tbody><tr><th id="testr1c1"></th><td headers="testr1c1"></td><td headers="testr1c1"></td><td headers="testr1c1"></td></tr><tr><th id="testr2c1"></th><td headers="testr2c1"></td><td headers="testr2c1"></td><td headers="testr2c1"></td></tr><tr><th id="testr3c1"></th><td headers="testr3c1"></td><td headers="testr3c1"></td><td headers="testr3c1"></td></tr></tbody></table>');

        $this->clickTopToolbarButton('historyRedo');

        $this->assertHTMLMatch('<p>Test %1%</p><table style="width: 100%;" id="test" border="1"><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>');

    }//end testUndoRedoForHeaderToNormalCellConversion()


    /**
     * Tests that inline toolbar stays open after you move a column.
     *
     * @return void
     */
    public function testInlineToolbarStaysOpenAfterMovingColumn()
    {
        $this->useTest(1);

        $this->insertTable(1);

        // Test moving a column right
        $this->showTools(5, 'col');
        $this->clickInlineToolbarButton('mergeRight');
        $this->assertTrue($this->inlineToolbarButtonExists('delete'));

        // Test moving a column left
        $this->showTools(7, 'col');
        $this->clickInlineToolbarButton('mergeLeft');
        $this->assertTrue($this->inlineToolbarButtonExists('delete'));

    }//end testInlineToolbarStaysOpenAfterMovingColumn()


}//end class

?>
