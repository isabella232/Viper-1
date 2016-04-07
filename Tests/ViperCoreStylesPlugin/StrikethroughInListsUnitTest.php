<?php

require_once 'AbstractViperUnitTest.php';

class Viper_Tests_ViperCoreStylesPlugin_StrikethroughInListsUnitTest extends AbstractViperUnitTest
{


    /**
     * Test applying strikethrough to a word in a list.
     *
     * @return void
     */
    public function testAddAndRemoveStrikethroughToWordInListItem()
    {
        $this->useTest(1);

        // Apply strikethrough using top toolbar
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('strikethrough');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough', 'active'), 'strikethrough icon in the top toolbar is not active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 <del>%1%</del></li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 %2%</li><li>item 3</li></ol>');

        $this->selectKeyword(2);
        $this->clickTopToolbarButton('strikethrough');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough', 'active'), 'Strikethrough icon in the top toolbar is not active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 <del>%1%</del></li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 <del>%2%</del></li><li>item 3</li></ol>');

        // Remove strikethrough using top toolbar
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('strikethrough', 'active');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough'), 'Strikethrough icon in the top toolbar is active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 %1%</li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 <del>%2%</del></li><li>item 3</li></ol>');

        $this->selectKeyword(2);
        $this->clickTopToolbarButton('strikethrough', 'active');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough'), 'Strikethrough icon in the top toolbar is active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 %1%</li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 %2%</li><li>item 3</li></ol>');

    }//end testAddAndRemoveStrikethroughToWordInListItem()


    /**
     * Test applying strikethrough to a word a list item.
     *
     * @return void
     */
    public function testAddAndRemoveStrikethroughToListItem()
    {
        $this->useTest(1);

        // Apply strikethrough using top toolbar
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('strikethrough');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough', 'active'), 'Strikethrough icon in the top toolbar is not active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li><del>item 2 %1%</del></li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 %2%</li><li>item 3</li></ol>');

        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('strikethrough');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough', 'active'), 'Strikethrough icon in the top toolbar is not active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li><del>item 2 %1%</del></li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li><del>item 2 %2%</del></li><li>item 3</li></ol>');

         // Remove strikethrough using top toolbar
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('strikethrough', 'active');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough'), 'Strikethrough icon in the top toolbar is active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 %1%</li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li><del>item 2 %2%</del></li><li>item 3</li></ol>');

        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('strikethrough', 'active');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough'), 'Strikethrough icon in the top toolbar is active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 %1%</li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 %2%</li><li>item 3</li></ol>');

    }//end testAddAndRemoveStrikethroughToListItem()


    /**
     * Test applying strikethrough to a word a list.
     *
     * @return void
     */
    public function testAddAndRemoveStrikethroughToList()
    {
        $this->useTest(1);

        // Apply strikethrough using top toolbar
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('strikethrough');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough', 'active'), 'Strikethrough icon in the top toolbar is not active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li><del>item 1</del></li><li><del>item 2 %1%</del></li><li><del>item 3</del></li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 %2%</li><li>item 3</li></ol>');

        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('strikethrough');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough', 'active'), 'Strikethrough icon in the top toolbar is not active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li><del>item 1</del></li><li><del>item 2 %1%</del></li><li><del>item 3</del></li></ul><p>Ordered list:</p><ol><li><del>item 1</del></li><li><del>item 2 %2%</del></li><li><del>item 3</del></li></ol>');

         // Remove strikethrough using top toolbar
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('strikethrough', 'active');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough'), 'Strikethrough icon in the top toolbar is active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 %1%</li><li>item 3</li></ul><p>Ordered list:</p><ol><li><del>item 1</del></li><li><del>item 2 %2%</del></li><li><del>item 3</del></li></ol>');

        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('strikethrough', 'active');
        $this->assertTrue($this->topToolbarButtonExists('strikethrough'), 'Strikethrough icon in the top toolbar is active');
        $this->assertHTMLMatch('<p>Unordered list:</p><ul><li>item 1</li><li>item 2 %1%</li><li>item 3</li></ul><p>Ordered list:</p><ol><li>item 1</li><li>item 2 %2%</li><li>item 3</li></ol>');

    }//end testAddAndRemoveStrikethroughToListItem()


    /**
     * Test deleting content from unordered lists including strikethrough formating
     *
     * @return void
     */
    public function testDeletingStrikethroughContentFromUnorderedLists()
    {
        // Check deleting a word after the strikethrough content
        $this->useTest(2);
        $this->moveToKeyword(2, 'right');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li>%1% <del>test</del></li></ul>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li>%1% <del>testcontent</del></li></ul>');

        // Check deleting from the end of the list item including strikethrough content
        $this->useTest(2);
        $this->moveToKeyword(2, 'right');

        for ($i = 0; $i < 8; $i++) {
            $this->sikuli->keyDown('Key.BACKSPACE');
        }

        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li>%1%</li></ul>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li>%1% content</li></ul>');

        // Check deleting from the list item of the paragraph
        $this->useTest(2);
        $this->moveToKeyword(1, 'left');
        $this->sikuli->keyDown('Key.DELETE');
        $this->sikuli->keyDown('Key.DELETE');
        $this->sikuli->keyDown('Key.DELETE');
        $this->sikuli->keyDown('Key.DELETE');
        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li><del>test</del> %2%</li></ul>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li><del>contenttest</del> %2%</li></ul>');

        // Check deleting from the start of the list item including strikethrough content
        $this->useTest(2);
        $this->moveToKeyword(1, 'left');

        for ($i = 0; $i < 8; $i++) {
            $this->sikuli->keyDown('Key.DELETE');
        }

        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li>%2%</li></ul>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Unordered List:</p><ul><li>content %2%</li></ul>');

    }//end testDeletingStrikethroughContentFromUnorderedLists()


    /**
     * Test deleting content from ordered lists including strikethrough formating
     *
     * @return void
     */
    public function testDeletingStrikethroughContentFromOrderedLists()
    {
        // Check deleting a word after the stirkethrough content in a list
        $this->useTest(3);
        $this->moveToKeyword(2, 'right');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li>%1% <del>test</del></li></ol>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li>%1% <del>testcontent</del></li></ol>');

        // Check deleting from the end of the list item including stirkethrough content
        $this->useTest(3);
        $this->moveToKeyword(2, 'right');

        for ($i = 0; $i < 8; $i++) {
            $this->sikuli->keyDown('Key.BACKSPACE');
        }

        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li>%1%</li></ol>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li>%1% content</li></ol>');

        // Check deleting from the list item of the paragraph
        $this->useTest(3);
        $this->moveToKeyword(1, 'left');
        $this->sikuli->keyDown('Key.DELETE');
        $this->sikuli->keyDown('Key.DELETE');
        $this->sikuli->keyDown('Key.DELETE');
        $this->sikuli->keyDown('Key.DELETE');
        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li><del>test</del> %2%</li></ol>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li><del>contenttest</del> %2%</li></ol>');

        // Check deleting from the list item including stirkethrough content
        $this->useTest(3);
        $this->moveToKeyword(1, 'left');

        for ($i = 0; $i < 8; $i++) {
            $this->sikuli->keyDown('Key.DELETE');
        }

        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li>%2%</li></ol>');

        // Add content to check the position of the cursor
        $this->type('content');
        $this->assertHTMLMatch('<p>Ordered List:</p><ol><li>content %2%</li></ol>');

    }//end testDeletingStrikethroughContentFromOrderedLists()

}//end class

?>
