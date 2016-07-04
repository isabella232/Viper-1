<?php

require_once 'AbstractViperLinkPluginUnitTest.php';

class Viper_Tests_ViperLinkPlugin_ListsWithLinkUnitTest extends AbstractViperLinkPluginUnitTest
{

    /**
     * Test creating a link in a list item.
     *
     * @return void
     */
    public function testCreateLinkInAListItem()
    {
        // Using the inline toolbar in an unordered list
        $this->useTest(1);
        $this->selectKeyword(1);
        $this->clickInlineToolbarButton('link');
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Unordered list without links:</p><ul><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Using the inline toolbar in an ordered list
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->clickInlineToolbarButton('link');
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Ordered list without links:</p><ol><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

       // Using the top toolbar in an unordered list
        $this->useTest(1);
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('link');
        $this->assertTrue($this->topToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Unordered list without links:</p><ul><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Using the top toolbar in an ordered list
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('link');
        $this->assertTrue($this->topToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Ordered list without links:</p><ol><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

    }//end testCreateLinkInAListItem()


    /**
     * Test linking a list item.
     *
     * @return void
     */
    public function testLinkingAListItem()
    {
       // Using the top toolbar in an unordered list
        $this->useTest(1);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('link');
        $this->assertTrue($this->topToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Unordered list without links:</p><ul><li><a href="http://www.squizlabs.com">%1% item 1</a></li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Using the top toolbar in an ordered list
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('link');
        $this->assertTrue($this->topToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Ordered list without links:</p><ol><li><a href="http://www.squizlabs.com">%1% item 1</a></li><li>item 2</li><li>item 3 %2%</li></ol>');

    }//end testCreateLinkInAListItem()


    /**
     * Test linking a list.
     *
     * @return void
     */
    public function testLinkingAList()
    {
       // Using the top toolbar in an unordered list
        $this->useTest(1);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('link');
        $this->assertTrue($this->topToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Unordered list without links:</p><a href="http://www.squizlabs.com"><ul><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ul></a>');

        // Using the top toolbar in an ordered list
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('link');
        $this->assertTrue($this->topToolbarButtonExists('link', 'selected'), 'Toolbar button icon is not correct');
        $this->type('http://www.squizlabs.com');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>Ordered list without links:</p><a href="http://www.squizlabs.com"><ol><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ol></a>');

    }//end testLinkingAList()


    /**
     * Test link icons in the list.
     *
     * @return void
     */
    public function testLinkIconsInList()
    {
        $this->useTest(3, 2);

        // Check where the whole list item is linked
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectKeyword(2);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(2);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));

        // Check where only a word in the list item is linked
        $this->clickKeyword(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectKeyword(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(2);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));

        // Check inline toolbar with ordered list
        $this->useTest(4, 2);

        // Check where the whole list item is linked
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectKeyword(2);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(2);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));

        // Check where only a word in the list item is linked
        $this->clickKeyword(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectKeyword(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(2);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(1);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));
        $this->selectInlineToolbarLineageItem(0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('linkRemove'));
        $this->assertTrue($this->topToolbarButtonExists('link', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove'));

    }//end testCreateLinkInAListItem()


    /**
     * Test removing a link in a list item.
     *
     * @return void
     */
    public function testRemovingLinkFromALinkInAListItem()
    {
        // Using the inline toolbar in an unordered list

        // Clicking in the link
        $this->useTest(3);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ul>');

        // Selecting the link
        $this->useTest(3);
        $this->selectInlineToolbarLineageItem(2);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ul>');

        // Selecting the list item
        $this->useTest(3);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ul>');

        // Selecting the list
        $this->useTest(3);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Using the inline toolbar in an ordered list

        // Clicking in the link
        $this->useTest(4);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ol>');

        // Selecting the link
        $this->useTest(4);
        $this->selectInlineToolbarLineageItem(2);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ol>');

        // Selecting the list item
        $this->useTest(4);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ol>');

        // Selecting the list
        $this->useTest(4);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

       // Using the top toolbar in an unordered list

        // Clicking in the link
        $this->useTest(3);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ul>');

        // Selecting the link
        $this->useTest(3);
        $this->selectInlineToolbarLineageItem(2);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ul>');

        // Selecting the list item
        $this->useTest(3);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ul>');

        // Selecting the list
        $this->useTest(3);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Using the inline toolbar in an ordered list

        // Clicking in the link
        $this->useTest(4);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ol>');

        // Selecting the link
        $this->useTest(4);
        $this->selectInlineToolbarLineageItem(2);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ol>');

        // Selecting the list item
        $this->useTest(4);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 %2%</a></li></ol>');

        // Selecting the list
        $this->useTest(4);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

    }//end testRemovingLinkFromALinkInAListItem()


    /**
     * Test removing a link for a list item.
     *
     * @return void
     */
    public function testRemovingLinkForAListItem()
    {
        // Using the inline toolbar in an unordered list

       // Clicking in the link
       $this->useTest(3, 2);
       $this->clickInlineToolbarButton('linkRemove');
       $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

       // Selecting the linkg
       $this->useTest(3, 2);
       $this->selectInlineToolbarLineageItem(2);
       $this->clickInlineToolbarButton('linkRemove');
       $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

       // Selecting the list item
       $this->useTest(3);
       $this->selectInlineToolbarLineageItem(1);
       $this->clickInlineToolbarButton('linkRemove');
       $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>XAX item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 XBX</a></li></ul>');

       // Selecting the list
       $this->useTest(3, 2);
       $this->selectInlineToolbarLineageItem(0);
       $this->clickInlineToolbarButton('linkRemove');
       $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

       // Using the inline toolbar in an ordered list

       // Clicking in the link
       $this->useTest(4, 2);
       $this->clickInlineToolbarButton('linkRemove');
       $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

       // Selecting the link
       $this->useTest(4, 2);
       $this->selectInlineToolbarLineageItem(2);
       $this->clickInlineToolbarButton('linkRemove');
       $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

       // Selecting the list item
        $this->useTest(4);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>XAX item 1</li><li>item 2</li><li><a href="http://www.squizlabs.com">item 3 XBX</a></li></ol>');

        // Selecting the list
        $this->useTest(4, 2);
        $this->selectInlineToolbarLineageItem(0);
        sleep(1);
        $this->clickInlineToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

       // Using the top toolbar in an unordered list

        // Clicking in the link
        $this->useTest(3, 2);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Selecting the link
        $this->useTest(3, 2);
        $this->selectInlineToolbarLineageItem(2);
        sleep(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Selecting the list item
        $this->useTest(3, 2);
        $this->selectInlineToolbarLineageItem(1);
        sleep(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Selecting the list
        $this->useTest(3, 2);
        $this->selectInlineToolbarLineageItem(0);
        sleep(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Unordered list with links:</p><ul><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ul>');

        // Using the inline toolbar in an ordered list

        // Clicking in the link
        $this->useTest(4, 2);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

        // Selecting the link
        $this->useTest(4, 2);
        $this->selectInlineToolbarLineageItem(2);
        sleep(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

        // Selecting the list item
        $this->useTest(4, 2);
        $this->selectInlineToolbarLineageItem(1);
        sleep(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li><a href="http://www.squizlabs.com">%1%</a> item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

        // Selecting the list
        $this->useTest(4, 2);
        $this->selectInlineToolbarLineageItem(0);
        sleep(1);
        $this->clickTopToolbarButton('linkRemove');
        $this->assertHTMLMatch('<p>Ordered list with links:</p><ol><li>%1% item 1</li><li>item 2</li><li>item 3 %2%</li></ol>');

    }//end testRemovingLinkForAListItem()


     /**
     * Test format icon for linked list items.
     *
     * @return void
     */
    public function testFormatIconForLinkedListItems()
    {
        $this->useTest(3, 2);

        // Check where the whole list item is linked
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectKeyword(2);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(2);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(0);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));

        // Check where only a word in the list item is linked
        $this->clickKeyword(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectKeyword(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(2);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(0);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));

        // Check inline toolbar with ordered list
        $this->useTest(4, 2);

        // Check where the whole list item is linked
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectKeyword(2);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(2);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(0);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));

        // Check where only a word in the list item is linked
        $this->clickKeyword(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectKeyword(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(2);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(1);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->selectInlineToolbarLineageItem(0);
        $this->assertFalse($this->inlineToolbarButtonExists('formats'));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));

    }//end testFormatIconForLinkedListItems()


    /**
     * Test removing a link for a list item.
     *
     * @return void
     */
    public function testAddingListItemsToLinkedItem()
    {
        // Test ordered list
        // Test after linked item
        $this->useTest(7);
        $this->sikuli->keyDown('Key.CMD + a');
        $this->clickTopToolbarButton('listOl');
        $this->moveToKeyword(1, 'right');

        for ($i = 0; $i < 22; $i++) {
            $this->sikuli->keyDown('Key.RIGHT');
        }

        $this->sikuli->keyDown('Key.ENTER');
        $this->type('Test content');
        sleep(1);
        $this->assertHTMLMatch('<ol><li>%1% <a href="https://www.squiz.net">https://www.squiz.net</a></li><li>Test content</li></ol>');

        // Test before linked item
        $this->moveToKeyword(1, 'left');
        $this->sikuli->keyDown('Key.ENTER');
        $this->sikuli->keyDown('Key.LEFT');
        $this->type('Test content');
        $this->assertHTMLMatch('<ol><li>Test content</li><li>%1% <a href="https://www.squiz.net">https://www.squiz.net</a></li><li>Test content</li></ol>');

        // Test unordered list
        // Test after linked item
        $this->useTest(7);
        $this->sikuli->keyDown('Key.CMD + a');
        $this->clickTopToolbarButton('listUl');
        $this->moveToKeyword(1, 'right');

        for ($i = 0; $i < 22; $i++) {
            $this->sikuli->keyDown('Key.RIGHT');
        }

        $this->sikuli->keyDown('Key.ENTER');
        $this->type('Test content');
        sleep(1);
        $this->assertHTMLMatch('<ul><li>%1% <a href="https://www.squiz.net">https://www.squiz.net</a></li><li>Test content</li></ul>');

        // Test before linked item
        $this->moveToKeyword(1, 'left');
        $this->sikuli->keyDown('Key.ENTER');
        $this->sikuli->keyDown('Key.LEFT');
        $this->type('Test content');
        $this->assertHTMLMatch('<ul><li>Test content</li><li>%1% <a href="https://www.squiz.net">https://www.squiz.net</a></li><li>Test content</li></ul>');

    }//end testAddingListItemsToLinkedItem()



}//end class

?>
